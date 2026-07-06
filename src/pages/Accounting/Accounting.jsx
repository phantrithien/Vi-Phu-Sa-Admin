import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

import {
    Plus, Search, Filter, Edit, Trash2,
    Cloud, X, Save, FileText, Briefcase,
    Scale, FolderOpen, ExternalLink, AlertTriangle,
    Wallet, ArrowUpRight, ArrowDownLeft, Users, CheckCircle, Clock, Lock
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Accounting = () => {
    const { userRole } = useAuth();

    // 2. Tạo các biến kiểm tra quyền (có thể tùy chỉnh mảng role này)
    const isFreelancer = ['freelancer', 'ctv'].includes(userRole);
    const isManager = ['founder', 'front_office', 'back_office'].includes(userRole);

    const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'accounting', 'payroll'
    const [loading, setLoading] = useState(true);

    // ==========================================
    // 1. STATE KẾ TOÁN (THU/CHI CHUNG)
    // ==========================================
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [marketingExpense, setMarketingExpense] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        client: '', description: '', amount: '', type: 'Thu', status: 'Đã thanh toán'
    });

    // ==========================================
    // 2. STATE LƯƠNG & THƯỞNG (PAYROLL)
    // ==========================================
    const [payrollList, setPayrollList] = useState([]);
    const [payrollSearch, setPayrollSearch] = useState('');
    const [payrollFilter, setPayrollFilter] = useState('All');

    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [payrollEditingId, setPayrollEditingId] = useState(null);
    const [payrollFormData, setPayrollFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        receiver: '', role: '', amount: '', description: 'Lương tháng ', status: 'Đã thanh toán'
    });

    // ==========================================
    // 3. STATE HÀNH CHÍNH & PHÁP LÝ
    // ==========================================
    const [documents, setDocuments] = useState([]);
    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [adminFilter, setAdminFilter] = useState('All');

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [adminEditingId, setAdminEditingId] = useState(null);
    const [adminFormData, setAdminFormData] = useState({
        title: '', category: 'Hợp đồng', partner: '', dateSigned: new Date().toISOString().split('T')[0], expirationDate: '', status: 'Đang hiệu lực', fileLink: ''
    });

    // ==========================================
    // EFFECTS (LẤY DỮ LIỆU)
    // ==========================================
    useEffect(() => {
        // Kế toán Thu/Chi
        const unsubTx = onSnapshot(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')), (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Lương Thưởng
        const unsubPayroll = onSnapshot(query(collection(db, 'payroll'), orderBy('timestamp', 'desc')), (snapshot) => {
            setPayrollList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Hành chính Pháp lý
        const unsubDocs = onSnapshot(query(collection(db, 'admin_documents'), orderBy('timestamp', 'desc')), (snapshot) => {
            setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        // Đồng bộ Kế toán Marketing
        const unsubMarketing = onSnapshot(doc(db, 'accounting_sync', 'marketing_expenses'), (docSnap) => {
            if (docSnap.exists()) setMarketingExpense(docSnap.data().amount || 0);
        });

        return () => { unsubTx(); unsubPayroll(); unsubDocs(); unsubMarketing(); };
    }, []);

    // Tab thay đổi thì reset search
    useEffect(() => {
        setSearchTerm(''); setAdminSearchTerm(''); setPayrollSearch('');
    }, [activeTab]);

    // ==========================================
    // HELPERS & FORMAT
    // ==========================================
    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    // ==========================================
    // XỬ LÝ LƯƠNG & THƯỞNG (PAYROLL)
    // ==========================================
    const handlePayrollSave = async (e) => {
        e.preventDefault();
        try {
            const amountNum = parseInt(payrollFormData.amount.toString().replace(/[^0-9]/g, ''), 10) || 0;
            const payload = { ...payrollFormData, amount: amountNum, timestamp: payrollEditingId ? payrollFormData.timestamp : Date.now() };
            if (payrollEditingId) await updateDoc(doc(db, 'payroll', payrollEditingId), payload);
            else await addDoc(collection(db, 'payroll'), payload);
            closePayrollModal();
        } catch (error) { console.error(error); alert("Lỗi khi lưu bảng lương!"); }
    };

    const handlePayrollDelete = async (id, name) => {
        if (window.confirm(`Xóa bản ghi lương của nhân sự: ${name}?`)) {
            try { await deleteDoc(doc(db, 'payroll', id)); } catch (error) { alert("Lỗi khi xóa!"); }
        }
    };

    const openPayrollModal = (pr = null) => {
        if (pr) {
            setPayrollEditingId(pr.id);
            setPayrollFormData({ ...pr, amount: pr.amount ? pr.amount.toString() : '', timestamp: pr.timestamp || Date.now() });
        } else {
            setPayrollEditingId(null);
            setPayrollFormData({ date: new Date().toISOString().split('T')[0], receiver: '', role: '', amount: '', description: 'Lương tháng ', status: 'Đã thanh toán' });
        }
        setIsPayrollModalOpen(true);
    };
    const closePayrollModal = () => { setIsPayrollModalOpen(false); setPayrollEditingId(null); };

    // ==========================================
    // XỬ LÝ KẾ TOÁN (THU/CHI)
    // ==========================================
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const amountNum = parseInt(formData.amount.toString().replace(/[^0-9]/g, ''), 10) || 0;
            const payload = { ...formData, amount: amountNum, timestamp: editingId ? formData.timestamp : Date.now() };
            if (editingId) await updateDoc(doc(db, 'transactions', editingId), payload);
            else await addDoc(collection(db, 'transactions'), payload);
            closeModal();
        } catch (error) { console.error(error); alert("Lỗi khi lưu!"); }
    };
    const handleDelete = async (id, name) => {
        if (window.confirm(`Xóa giao dịch: ${name}?`)) {
            try { await deleteDoc(doc(db, 'transactions', id)); } catch (error) { alert("Lỗi khi xóa!"); }
        }
    };
    const openModal = (tx = null) => {
        if (tx) { setEditingId(tx.id); setFormData({ ...tx, amount: tx.amount ? tx.amount.toString() : '', timestamp: tx.timestamp || Date.now() }); }
        else { setEditingId(null); setFormData({ date: new Date().toISOString().split('T')[0], client: '', description: '', amount: '', type: 'Thu', status: 'Đã thanh toán' }); }
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

    // ==========================================
    // XỬ LÝ HÀNH CHÍNH & PHÁP LÝ
    // ==========================================
    const handleAdminSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...adminFormData, timestamp: adminEditingId ? adminFormData.timestamp : Date.now() };
            if (adminEditingId) await updateDoc(doc(db, 'admin_documents', adminEditingId), payload);
            else await addDoc(collection(db, 'admin_documents'), payload);
            closeAdminModal();
        } catch (error) { alert("Lỗi khi lưu tài liệu!"); }
    };
    const handleAdminDelete = async (id, title) => {
        if (window.confirm(`Xóa tài liệu: ${title}?`)) {
            try { await deleteDoc(doc(db, 'admin_documents', id)); } catch (error) { alert("Lỗi khi xóa!"); }
        }
    };
    const openAdminModal = (docItem = null) => {
        if (docItem) { setAdminEditingId(docItem.id); setAdminFormData({ ...docItem, timestamp: docItem.timestamp || Date.now() }); }
        else { setAdminEditingId(null); setAdminFormData({ title: '', category: 'Hợp đồng', partner: '', dateSigned: new Date().toISOString().split('T')[0], expirationDate: '', status: 'Đang hiệu lực', fileLink: '' }); }
        setIsAdminModalOpen(true);
    };
    const closeAdminModal = () => { setIsAdminModalOpen(false); setAdminEditingId(null); };

    // ==========================================
    // LỌC & TÍNH TOÁN
    // ==========================================
    // Admin
    const filteredDocs = documents.filter(doc => {
        const matchSearch = `${doc.title || ''} ${doc.partner || ''}`.toLowerCase().includes(adminSearchTerm.toLowerCase());
        const matchCategory = adminFilter === 'All' ? true : doc.category === adminFilter;
        return matchSearch && matchCategory;
    });
    const countContract = documents.filter(d => d.category === 'Hợp đồng').length;
    const countLegal = documents.filter(d => d.category === 'Pháp lý').length;
    const countInternal = documents.filter(d => d.category === 'Nội bộ').length;

    const checkExpiration = (expDateString) => {
        if (!expDateString) return { isExpired: false, isWarning: false };
        const expDate = new Date(expDateString);
        const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { isExpired: true, isWarning: false, text: 'Đã hết hạn' };
        if (diffDays <= 30) return { isExpired: false, isWarning: true, text: `Còn ${diffDays} ngày` };
        return { isExpired: false, isWarning: false, text: 'An toàn' };
    };

    // Accounting
    const marketingTx = { id: 'sync-marketing', date: new Date().toISOString().split('T')[0], client: 'Phòng Marketing (Auto)', description: 'Đồng bộ tự động tổng chi phí Marketing', amount: marketingExpense, type: 'Chi', status: 'Đã thanh toán', isAutoSync: true };
    const combinedTransactions = marketingExpense > 0 ? [marketingTx, ...transactions] : transactions;
    const filteredTx = combinedTransactions.filter(tx => {
        const matchSearch = `${tx.client || ''} ${tx.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'All' ? true : tx.type === filterType;
        return matchSearch && matchType;
    });

    const totalIncome = filteredTx.filter(t => t.type === 'Thu' && t.status === 'Đã thanh toán').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpense = filteredTx.filter(t => t.type === 'Chi' && t.status === 'Đã thanh toán').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Payroll
    const filteredPayroll = payrollList.filter(pr => {
        const matchSearch = `${pr.receiver || ''} ${pr.role || ''} ${pr.description || ''}`.toLowerCase().includes(payrollSearch.toLowerCase());
        const matchStatus = payrollFilter === 'All' ? true : pr.status === payrollFilter;
        return matchSearch && matchStatus;
    });
    const totalPaidSalary = payrollList.filter(p => p.status === 'Đã thanh toán').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPendingSalary = payrollList.filter(p => p.status === 'Chờ thanh toán').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return (

        <div className="min-h-screen bg-[#0F0F0F] flex w-full max-w-[100vw] overflow-x-hidden relative text-vps-ivory">
            <Sidebar />

            <div className="flex-1 md:ml-64 p-5 pt-24 md:p-10 md:pt-10 overflow-y-auto w-full">

                {/* 1. HEADER CHUNG */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold drop-shadow-md">Hành chính & Kế toán</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                <Cloud className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Đã đồng bộ</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Quản lý dòng tiền, lương thưởng, pháp lý và giấy tờ doanh nghiệp.</p>
                    </div>

                    <button
                        onClick={() => {
                            if (activeTab === 'admin') openAdminModal();
                            else if (activeTab === 'accounting') openModal();
                            else openPayrollModal();
                        }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                    >
                        <Plus className="w-5 h-5" />
                        <span>
                            {activeTab === 'admin' ? 'Thêm Tài Liệu' : activeTab === 'accounting' ? 'Thêm Giao Dịch' : 'Thanh Toán Lương'}
                        </span>
                    </button>
                </div>

                {/* 2. THANH CHUYỂN TAB */}
                <div className="flex overflow-x-auto gap-3 mb-10 custom-scrollbar pb-2">
                    <button onClick={() => setActiveTab('admin')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'admin' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}>
                        <FolderOpen className="w-5 h-5" /> Pháp lý & Giấy tờ
                    </button>
                    <button onClick={() => setActiveTab('accounting')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'accounting' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}>
                        <Wallet className="w-5 h-5" /> Kế toán nội bộ
                    </button>
                    <button onClick={() => setActiveTab('payroll')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'payroll' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}>
                        <Users className="w-5 h-5" /> Lương & Thưởng
                    </button>
                </div>

                {/* 3. NỘI DUNG TỪNG TAB */}
                {/* ===================== TAB HÀNH CHÍNH ===================== */}
                {activeTab === 'admin' && (
                    isFreelancer ? (
                        <div className="bg-[#1A1A1A] border border-red-500/20 rounded-2xl p-16 text-center shadow-xl mt-8">
                            <Lock className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-400 mb-2">Khu vực hạn chế</h3>
                            <p className="text-gray-400 font-medium">Tài khoản Cộng tác viên / Freelancer không có quyền truy cập Giấy tờ & pháp lý.</p>
                        </div>
                    ) : (
                        <>
                            <div className="animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform">
                                        <div className="p-4 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20"><Briefcase className="w-8 h-8" /></div>
                                        <div><p className="text-sm text-gray-400 font-semibold mb-1">Hợp đồng đối tác</p><p className="text-3xl font-bold text-vps-ivory">{countContract}</p></div>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform">
                                        <div className="p-4 bg-vps-gold/10 text-vps-gold rounded-xl border border-vps-gold/20"><Scale className="w-8 h-8" /></div>
                                        <div><p className="text-sm text-gray-400 font-semibold mb-1">Hồ sơ Pháp lý</p><p className="text-3xl font-bold text-vps-ivory">{countLegal}</p></div>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center gap-4 hover:-translate-y-1 transition-transform">
                                        <div className="p-4 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20"><FileText className="w-8 h-8" /></div>
                                        <div><p className="text-sm text-gray-400 font-semibold mb-1">Biểu mẫu Nội bộ</p><p className="text-3xl font-bold text-vps-ivory">{countInternal}</p></div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input type="text" placeholder="Tìm kiếm tên tài liệu, đối tác..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors" />
                                    </div>
                                    <div className="relative min-w-[200px]">
                                        <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} className="w-full appearance-none h-full px-5 py-3.5 pr-10 bg-[#1A1A1A] border border-vps-gray/20 rounded-xl text-vps-ivory hover:border-vps-gold/50 focus:outline-none focus:border-vps-gold transition-colors cursor-pointer text-sm font-semibold">
                                            <option value="All">Tất cả danh mục</option><option value="Hợp đồng">Hợp đồng kinh tế</option><option value="Pháp lý">Hồ sơ pháp lý</option><option value="Nội bộ">Biểu mẫu nội bộ</option>
                                        </select>
                                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden mb-10">
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                                    <th className="p-5 font-semibold">Tên Tài liệu / Hợp đồng</th><th className="p-5 font-semibold">Đối tác</th><th className="p-5 font-semibold">Thời hạn</th><th className="p-5 font-semibold text-center">Tệp đính kèm</th><th className="p-5 font-semibold text-center">Trạng thái</th><th className="p-5 font-semibold text-center">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-vps-gray/10">
                                                {filteredDocs.length === 0 ? <tr><td colSpan="6" className="p-12 text-center text-gray-500">Kho lưu trữ trống hoặc không tìm thấy.</td></tr> :
                                                    filteredDocs.map(docItem => {
                                                        const exp = checkExpiration(docItem.expirationDate);
                                                        return (
                                                            <tr key={docItem.id} className="hover:bg-[#222] transition-colors group">
                                                                <td className="p-5">
                                                                    <div className="font-bold text-vps-gold text-base mb-2 group-hover:text-yellow-400 transition-colors">{docItem.title}</div>
                                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${docItem.category === 'Hợp đồng' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : docItem.category === 'Pháp lý' ? 'bg-vps-gold/10 border-vps-gold/20 text-vps-gold' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>{docItem.category}</span>
                                                                </td>
                                                                <td className="p-5 text-sm text-gray-300 font-medium">{docItem.partner || '-'}</td>
                                                                <td className="p-5 text-xs text-gray-400 font-medium">
                                                                    <div>Ký: {docItem.dateSigned}</div>
                                                                    {docItem.expirationDate && <div className={`mt-1.5 flex items-center gap-1.5 ${exp.isExpired ? 'text-red-400' : exp.isWarning ? 'text-orange-400' : 'text-gray-500'}`}>{(exp.isExpired || exp.isWarning) && <AlertTriangle className="w-3.5 h-3.5" />} Hết hạn: {docItem.expirationDate}</div>}
                                                                </td>
                                                                <td className="p-5 text-center">
                                                                    {docItem.fileLink ? <a href={docItem.fileLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"><ExternalLink className="w-3.5 h-3.5" /> Mở File</a> : <span className="text-gray-600">-</span>}
                                                                </td>
                                                                <td className="p-5 text-center"><span className="text-[10px] font-bold uppercase tracking-wider text-vps-ivory/70 border border-vps-gray/30 px-3 py-1.5 rounded-full">{docItem.status}</span></td>
                                                                <td className="p-5 flex justify-center gap-3 mt-1">
                                                                    <button onClick={() => openAdminModal(docItem)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleAdminDelete(docItem.id, docItem.title)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Mobile View */}
                                    <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                                        {filteredDocs.map(docItem => {
                                            const exp = checkExpiration(docItem.expirationDate);
                                            return (
                                                <div key={docItem.id} className="p-5 flex flex-col gap-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 pr-3"><h3 className="text-base font-bold text-vps-gold mb-1">{docItem.title}</h3><p className="text-xs text-gray-400 font-medium">{docItem.partner || 'Nội bộ'}</p></div>
                                                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${docItem.category === 'Hợp đồng' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : docItem.category === 'Pháp lý' ? 'bg-vps-gold/10 border-vps-gold/20 text-vps-gold' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>{docItem.category}</span>
                                                    </div>
                                                    {docItem.expirationDate && <div className={`text-xs font-medium flex items-center gap-1.5 ${exp.isExpired ? 'text-red-400' : exp.isWarning ? 'text-orange-400' : 'text-gray-500'}`}>{(exp.isExpired || exp.isWarning) && <AlertTriangle className="w-3.5 h-3.5" />} Hết hạn: {docItem.expirationDate}</div>}
                                                    <div className="flex justify-between items-center border-t border-vps-gray/20 pt-4">
                                                        {docItem.fileLink ? <a href={docItem.fileLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-blue-400"><ExternalLink className="w-3.5 h-3.5" /> Mở File</a> : <span></span>}
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => openAdminModal(docItem)} className="px-3 py-1.5 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                                            <button onClick={() => handleAdminDelete(docItem.id, docItem.title)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* ===================== TAB KẾ TOÁN NỘI BỘ ===================== */}
                {activeTab === 'admin' || activeTab === 'accounting' && (
                    isFreelancer ? (
                        <div className="bg-[#1A1A1A] border border-red-500/20 rounded-2xl p-16 text-center shadow-xl mt-8">
                            <Lock className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-400 mb-2">Khu vực hạn chế</h3>
                            <p className="text-gray-400 font-medium">Tài khoản Cộng tác viên / Freelancer không có quyền truy cập Giấy tờ & pháp lý.</p>
                        </div>
                    ) : (
                        <>
                            <div className="animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center justify-between group hover:border-green-500/30 transition-colors">
                                        <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Thu (Đã thanh toán)</p><h3 className="text-2xl md:text-3xl font-bold text-green-400 tracking-tight">{formatCurrency(totalIncome)}</h3></div>
                                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><ArrowUpRight className="w-6 h-6 text-green-400" /></div>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center justify-between group hover:border-red-500/30 transition-colors">
                                        <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Chi (Đã thanh toán)</p><h3 className="text-2xl md:text-3xl font-bold text-red-400 tracking-tight">{formatCurrency(totalExpense)}</h3></div>
                                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><ArrowDownLeft className="w-6 h-6 text-red-400" /></div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input type="text" placeholder="Tìm kiếm khách hàng, nội dung..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors" />
                                    </div>
                                    <div className="relative min-w-[200px]">
                                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full appearance-none h-full px-5 py-3.5 pr-10 bg-[#1A1A1A] border border-vps-gray/20 rounded-xl text-vps-ivory hover:border-vps-gold/50 focus:outline-none focus:border-vps-gold transition-colors cursor-pointer text-sm font-semibold">
                                            <option value="All">Tất cả giao dịch</option><option value="Thu">Chỉ Thu</option><option value="Chi">Chỉ Chi</option>
                                        </select>
                                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden mb-10">
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                                    <th className="p-5 font-semibold">Ngày</th><th className="p-5 font-semibold">Khách hàng / Đối tác</th><th className="p-5 font-semibold text-right">Số tiền (VNĐ)</th><th className="p-5 font-semibold text-center">Loại</th><th className="p-5 font-semibold text-center">Trạng thái</th><th className="p-5 font-semibold text-center">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-vps-gray/10">
                                                {filteredTx.length === 0 ? <tr><td colSpan="6" className="p-12 text-center text-gray-500 font-medium">Không tìm thấy giao dịch nào.</td></tr> :
                                                    filteredTx.map(tx => (
                                                        <tr key={tx.id} className="hover:bg-[#222] transition-colors group">
                                                            <td className="p-5 text-sm font-medium text-gray-400">{tx.date}</td>
                                                            <td className="p-5">
                                                                <div className="font-bold text-vps-ivory text-base group-hover:text-white transition-colors">{tx.client}</div>
                                                                {tx.description && <div className="text-xs text-gray-500 font-medium mt-1.5">{tx.description}</div>}
                                                            </td>
                                                            <td className={`p-5 text-base font-bold text-right ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'Thu' ? '+' : '-'}{formatCurrency(tx.amount)}</td>
                                                            <td className="p-5 text-center"><span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${tx.type === 'Thu' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{tx.type}</span></td>
                                                            <td className="p-5 text-center"><span className="text-[10px] font-bold uppercase tracking-wider text-vps-ivory/70 border border-vps-gray/30 px-3 py-1.5 rounded-full">{tx.status}</span></td>
                                                            <td className="p-5 flex justify-center gap-3 mt-1.5">
                                                                {tx.isAutoSync ? <span className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full uppercase tracking-wider">Auto Cloud</span> :
                                                                    <><button onClick={() => openModal(tx)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                                        <button onClick={() => handleDelete(tx.id, tx.client)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                                        {filteredTx.map(tx => (
                                            <div key={tx.id} className="p-5 flex flex-col gap-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-3"><h3 className="text-base font-bold text-vps-ivory mb-1">{tx.client}</h3>{tx.description && <p className="text-xs font-medium text-gray-500 line-clamp-1">{tx.description}</p>}</div>
                                                    <span className={`shrink-0 block text-lg font-bold ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'Thu' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-medium text-gray-400"><span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {tx.date}</span><span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${tx.type === 'Thu' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{tx.type}</span></div>
                                                <div className="flex justify-between items-center border-t border-vps-gray/20 pt-4 mt-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-vps-ivory/70 border border-vps-gray/30 px-2.5 py-1 rounded-full">{tx.status}</span>
                                                    {tx.isAutoSync ? <span className="text-[9px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase">Auto Cloud</span> :
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => openModal(tx)} className="px-3 py-1.5 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                                            <button onClick={() => handleDelete(tx.id, tx.client)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                                        </div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* ===================== TAB LƯƠNG & THƯỞNG (PAYROLL) ===================== */}

                {activeTab === 'admin' || activeTab === 'payroll' && (
                    isFreelancer ? (
                        <div className="bg-[#1A1A1A] border border-red-500/20 rounded-2xl p-16 text-center shadow-xl mt-8">
                            <Lock className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-400 mb-2">Khu vực hạn chế</h3>
                            <p className="text-gray-400 font-medium">Tài khoản Cộng tác viên / Freelancer không có quyền truy cập Giấy tờ & pháp lý.</p>
                        </div>
                    ) : (
                        <>
                            <div className="animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center justify-between group hover:border-green-500/30 transition-colors">
                                        <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đã Chi Trả</p><h3 className="text-2xl md:text-3xl font-bold text-green-400 tracking-tight">{formatCurrency(totalPaidSalary)}</h3></div>
                                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl flex items-center justify-between group hover:border-orange-500/30 transition-colors">
                                        <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Chờ Chi Trả (Công nợ)</p><h3 className="text-2xl md:text-3xl font-bold text-orange-400 tracking-tight">{formatCurrency(totalPendingSalary)}</h3></div>
                                        <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20"><Clock className="w-6 h-6 text-orange-400" /></div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input type="text" placeholder="Tìm tên nhân viên, chức vụ, tháng..." value={payrollSearch} onChange={(e) => setPayrollSearch(e.target.value)} className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors" />
                                    </div>
                                    <div className="relative min-w-[200px]">
                                        <select value={payrollFilter} onChange={(e) => setPayrollFilter(e.target.value)} className="w-full appearance-none h-full px-5 py-3.5 pr-10 bg-[#1A1A1A] border border-vps-gray/20 rounded-xl text-vps-ivory hover:border-vps-gold/50 focus:outline-none focus:border-vps-gold transition-colors cursor-pointer text-sm font-semibold">
                                            <option value="All">Tất cả trạng thái</option><option value="Đã thanh toán">Đã thanh toán</option><option value="Chờ thanh toán">Chờ thanh toán</option>
                                        </select>
                                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden mb-10">
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                                    <th className="p-5 font-semibold">Ngày / Tháng</th><th className="p-5 font-semibold">Nhân viên & Vị trí</th><th className="p-5 font-semibold text-right">Lương thực nhận</th><th className="p-5 font-semibold text-center">Trạng thái</th><th className="p-5 font-semibold text-center">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-vps-gray/10">
                                                {filteredPayroll.length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-gray-500 font-medium">Không tìm thấy bản ghi lương nào.</td></tr> :
                                                    filteredPayroll.map(pr => (
                                                        <tr key={pr.id} className="hover:bg-[#222] transition-colors group">
                                                            <td className="p-5 text-sm font-medium text-gray-400">
                                                                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{pr.date}</div>
                                                                {pr.description && <span className="block text-xs font-normal text-gray-500 mt-1.5">{pr.description}</span>}
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="font-bold text-vps-gold text-base group-hover:text-yellow-400 transition-colors">{pr.receiver}</div>
                                                                <div className="text-xs text-gray-500 font-medium mt-1">{pr.role}</div>
                                                            </td>
                                                            <td className="p-5 text-base font-bold text-right text-purple-400">{formatCurrency(pr.amount)}</td>
                                                            <td className="p-5 text-center"><span className={`text-[10px] font-bold uppercase tracking-wider border px-3 py-1.5 rounded-full ${pr.status === 'Đã thanh toán' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{pr.status}</span></td>
                                                            <td className="p-5 flex justify-center gap-3 mt-1.5">
                                                                <button onClick={() => openPayrollModal(pr)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                                <button onClick={() => handlePayrollDelete(pr.id, pr.receiver)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                                        {filteredPayroll.map(pr => (
                                            <div key={pr.id} className="p-5 flex flex-col gap-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-3"><h3 className="text-base font-bold text-vps-gold mb-1">{pr.receiver}</h3><p className="text-xs font-medium text-gray-400">{pr.role}</p></div>
                                                    <span className="block text-lg font-bold text-purple-400 shrink-0">{formatCurrency(pr.amount)}</span>
                                                </div>
                                                <div className="bg-[#222] p-3 rounded-lg border border-vps-gray/10">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1.5"><Clock className="w-3.5 h-3.5" /> {pr.date}</div>
                                                    <div className="text-xs text-gray-500">{pr.description}</div>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-full ${pr.status === 'Đã thanh toán' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{pr.status}</span>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => openPayrollModal(pr)} className="px-3 py-1.5 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                                        <button onClick={() => handlePayrollDelete(pr.id, pr.receiver)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                )}

                {/* ========================================== */}
                {/* MODALS DÙNG CHUNG */}
                {/* ========================================== */}
                {/* Modal Admin (Giữ nguyên UI nâng cấp) */}
                {isAdminModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-vps-gray/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">{adminEditingId ? 'Chỉnh Sửa Tài Liệu' : 'Thêm Tài Liệu Mới'}</h2>
                                <button onClick={closeAdminModal} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleAdminSave} className="p-7 space-y-6">
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên tài liệu / Hợp đồng *</label><input type="text" required value={adminFormData.title} onChange={(e) => setAdminFormData({ ...adminFormData, title: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="VD: Hợp đồng kinh tế..." /></div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phân loại *</label><select value={adminFormData.category} onChange={(e) => setAdminFormData({ ...adminFormData, category: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors"><option value="Hợp đồng">Hợp đồng kinh tế</option><option value="Pháp lý">Hồ sơ Pháp lý</option><option value="Nội bộ">Biểu mẫu Nội bộ</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Đối tác liên quan</label><input type="text" value={adminFormData.partner} onChange={(e) => setAdminFormData({ ...adminFormData, partner: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="Để trống nếu nội bộ" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ngày ký / Ban hành *</label><input type="date" required value={adminFormData.dateSigned} onChange={(e) => setAdminFormData({ ...adminFormData, dateSigned: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark] transition-colors" /></div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ngày hết hạn (Nếu có)</label><input type="date" value={adminFormData.expirationDate} onChange={(e) => setAdminFormData({ ...adminFormData, expirationDate: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark] transition-colors" /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">Đường dẫn Google Drive (Tùy chọn)</label><input type="url" value={adminFormData.fileLink} onChange={(e) => setAdminFormData({ ...adminFormData, fileLink: e.target.value })} className="w-full bg-[#111] border border-blue-500/30 rounded-xl p-3.5 text-blue-400 focus:border-blue-400 outline-none transition-colors" placeholder="https://drive.google.com/..." /></div>
                                <div><label className="block text-xs font-bold text-vps-gold mb-2 uppercase tracking-wider">Trạng thái *</label><select value={adminFormData.status} onChange={(e) => setAdminFormData({ ...adminFormData, status: e.target.value })} className="w-full bg-[#111] border border-vps-gold/50 rounded-xl p-3.5 text-vps-gold focus:outline-none appearance-none transition-colors font-bold"><option value="Đang hiệu lực">Đang hiệu lực</option><option value="Chờ ký">Chờ ký kết</option><option value="Đã thanh lý">Đã thanh lý</option><option value="Đã hủy">Đã hủy bỏ</option></select></div>
                                <div className="pt-8 border-t border-vps-gray/20 flex gap-4"><button type="button" onClick={closeAdminModal} className="w-1/3 px-4 py-4 bg-[#222] border border-vps-gray/20 text-vps-ivory rounded-xl font-bold hover:bg-[#333] transition-colors">Hủy</button><button type="submit" className="w-2/3 px-4 py-4 bg-vps-gold text-vps-black rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)]"><Save className="w-5 h-5" />Lưu Tài Liệu</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Accounting */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-vps-gray/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">{editingId ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</h2>
                                <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-7 space-y-6">
                                <div className="grid grid-cols-2 gap-5">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Loại *</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={`w-full bg-[#111] border rounded-xl p-3.5 font-bold outline-none appearance-none transition-colors ${formData.type === 'Thu' ? 'text-green-400 border-green-500/50' : 'text-red-400 border-red-500/50'}`}><option value="Thu" className="text-green-400">Thu Tiền (+)</option><option value="Chi" className="text-red-400">Chi Tiền (-)</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ngày *</label><input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark] transition-colors" /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Khách hàng / Đối tác *</label><input type="text" required value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="Nguyễn Văn A, Công ty X..." /></div>
                                <div><label className="block text-xs font-bold text-vps-gold mb-2 uppercase tracking-wider">Số tiền (VNĐ) *</label><input type="number" required min="0" step="1000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-vps-gold/10 border border-vps-gold/30 rounded-xl p-3.5 text-vps-gold font-bold focus:outline-none transition-colors text-lg tracking-wider" placeholder="VD: 5000000" />{formData.amount && <p className="text-xs text-gray-400 mt-2 font-medium">Hiển thị: <span className="text-vps-gold">{formatCurrency(formData.amount)}</span></p>}</div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Nội dung chi tiết</label><textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none resize-none transition-colors" placeholder="Thanh toán đợt 1..." /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Trạng thái *</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors"><option value="Đã thanh toán">Đã thanh toán (Hoàn tất)</option><option value="Chờ thanh toán">Chờ thanh toán (Công nợ)</option><option value="Đã hủy">Đã hủy bỏ</option></select></div>
                                <div className="pt-8 border-t border-vps-gray/20 flex gap-4"><button type="button" onClick={closeModal} className="w-1/3 px-4 py-4 bg-[#222] border border-vps-gray/20 text-vps-ivory rounded-xl font-bold hover:bg-[#333] transition-colors">Hủy</button><button type="submit" className="w-2/3 px-4 py-4 bg-vps-gold text-vps-black rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)]"><Save className="w-5 h-5" />Lưu Giao Dịch</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Payroll */}
                {isPayrollModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-vps-gray/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">{payrollEditingId ? 'Chỉnh Sửa Lương' : 'Thanh Toán Lương Mới'}</h2>
                                <button onClick={closePayrollModal} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handlePayrollSave} className="p-7 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên nhân viên *</label><input type="text" required value={payrollFormData.receiver} onChange={(e) => setPayrollFormData({ ...payrollFormData, receiver: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="Nguyễn Văn A..." /></div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Vị trí / Chức vụ *</label><input type="text" required value={payrollFormData.role} onChange={(e) => setPayrollFormData({ ...payrollFormData, role: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="Quay phim, Editor..." /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div><label className="block text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">Lương thực nhận (VNĐ) *</label><input type="number" required min="0" step="1000" value={payrollFormData.amount} onChange={(e) => setPayrollFormData({ ...payrollFormData, amount: e.target.value })} className="w-full bg-purple-500/10 border border-purple-500/30 rounded-xl p-3.5 text-purple-400 font-bold focus:outline-none transition-colors tracking-wider" placeholder="VD: 15000000" />{payrollFormData.amount && <p className="text-[10px] text-gray-400 mt-2 font-medium">Hiển thị: <span className="text-purple-400">{formatCurrency(payrollFormData.amount)}</span></p>}</div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ngày trả / Chốt *</label><input type="date" required value={payrollFormData.date} onChange={(e) => setPayrollFormData({ ...payrollFormData, date: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark] transition-colors" /></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Nội dung</label><input type="text" value={payrollFormData.description} onChange={(e) => setPayrollFormData({ ...payrollFormData, description: e.target.value })} className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="VD: Lương tháng 5, Thưởng dự án..." /></div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Trạng thái *</label><select value={payrollFormData.status} onChange={(e) => setPayrollFormData({ ...payrollFormData, status: e.target.value })} className={`w-full bg-[#111] border rounded-xl p-3.5 font-bold outline-none appearance-none transition-colors ${payrollFormData.status === 'Đã thanh toán' ? 'text-green-400 border-green-500/50' : 'text-orange-400 border-orange-500/50'}`}><option value="Đã thanh toán" className="text-green-400">Đã thanh toán (Hoàn tất)</option><option value="Chờ thanh toán" className="text-orange-400">Chờ thanh toán (Công nợ)</option></select></div>
                                <div className="pt-8 border-t border-vps-gray/20 flex gap-4"><button type="button" onClick={closePayrollModal} className="w-1/3 px-4 py-4 bg-[#222] border border-vps-gray/20 text-vps-ivory rounded-xl font-bold hover:bg-[#333] transition-colors">Hủy</button><button type="submit" className="w-2/3 px-4 py-4 bg-vps-gold text-vps-black rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)]"><Save className="w-5 h-5" />Lưu Bản Ghi</button></div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div >
    );

};

export default Accounting;