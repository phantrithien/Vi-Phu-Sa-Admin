import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Plus, Search, Filter, Edit, Trash2,
    Cloud, X, Save, FileText, Briefcase,
    Scale, FolderOpen, ExternalLink, AlertTriangle
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Accounting = () => {
    // ==========================================
    // 1. STATE CHUNG & KẾ TOÁN
    // ==========================================
    // Đã đổi state mặc định thành 'admin' để vừa vào là mở Pháp lý & Giấy tờ
    const [activeTab, setActiveTab] = useState('admin');
    const [loading, setLoading] = useState(true);

    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [marketingExpense, setMarketingExpense] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        client: '',
        description: '',
        amount: '',
        type: 'Thu',
        status: 'Đã thanh toán'
    });

    // ==========================================
    // 2. STATE HÀNH CHÍNH & PHÁP LÝ
    // ==========================================
    const [documents, setDocuments] = useState([]);
    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [adminFilter, setAdminFilter] = useState('All');

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [adminEditingId, setAdminEditingId] = useState(null);
    const [adminFormData, setAdminFormData] = useState({
        title: '',
        category: 'Hợp đồng',
        partner: '',
        dateSigned: new Date().toISOString().split('T')[0],
        expirationDate: '',
        status: 'Đang hiệu lực',
        fileLink: ''
    });

    // ==========================================
    // 3. EFFECTS (LẤY DỮ LIỆU TỪ FIREBASE)
    // ==========================================

    // Lắng nghe chi phí Marketing (dành cho Kế toán)
    useEffect(() => {
        const unsubMarketing = onSnapshot(doc(db, 'accounting_sync', 'marketing_expenses'), (docSnap) => {
            if (docSnap.exists()) {
                setMarketingExpense(docSnap.data().amount || 0);
            }
        });
        return () => unsubMarketing();
    }, []);

    // Lắng nghe dữ liệu Kế Toán
    useEffect(() => {
        const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Lắng nghe dữ liệu Hành Chính
    useEffect(() => {
        const q = query(collection(db, 'admin_documents'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDocuments(data);
        });
        return () => unsubscribe();
    }, []);

    // ==========================================
    // 4. LOGIC XỬ LÝ KẾ TOÁN
    // ==========================================
    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa giao dịch: ${name}?`)) {
            try { await deleteDoc(doc(db, 'transactions', id)); }
            catch (error) { console.error(error); alert("Lỗi khi xóa!"); }
        }
    };

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

    const openModal = (tx = null) => {
        if (tx) {
            setEditingId(tx.id);
            setFormData({ ...tx, amount: tx.amount ? tx.amount.toString() : '', timestamp: tx.timestamp || Date.now() });
        } else {
            setEditingId(null);
            setFormData({ date: new Date().toISOString().split('T')[0], client: '', description: '', amount: '', type: 'Thu', status: 'Đã thanh toán' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    const marketingTx = {
        id: 'sync-marketing',
        date: new Date().toISOString().split('T')[0],
        client: 'Phòng Marketing (Auto)',
        description: 'Đồng bộ tự động tổng chi phí Marketing',
        amount: marketingExpense,
        type: 'Chi',
        status: 'Đã thanh toán',
        isAutoSync: true
    };
    const combinedTransactions = marketingExpense > 0 ? [marketingTx, ...transactions] : transactions;
    const filteredTx = combinedTransactions.filter(tx => {
        const matchSearch = `${tx.client || ''} ${tx.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = filterType === 'All' ? true : tx.type === filterType;
        return matchSearch && matchType;
    });

    // ==========================================
    // 5. LOGIC XỬ LÝ HÀNH CHÍNH & PHÁP LÝ
    // ==========================================
    const handleAdminDelete = async (id, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu: ${title}?`)) {
            try { await deleteDoc(doc(db, 'admin_documents', id)); }
            catch (error) { console.error(error); alert("Lỗi khi xóa!"); }
        }
    };

    const handleAdminSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...adminFormData, timestamp: adminEditingId ? adminFormData.timestamp : Date.now() };
            if (adminEditingId) await updateDoc(doc(db, 'admin_documents', adminEditingId), payload);
            else await addDoc(collection(db, 'admin_documents'), payload);
            closeAdminModal();
        } catch (error) { console.error(error); alert("Lỗi khi lưu tài liệu!"); }
    };

    const openAdminModal = (docItem = null) => {
        if (docItem) {
            setAdminEditingId(docItem.id);
            setAdminFormData({ ...docItem, timestamp: docItem.timestamp || Date.now() });
        } else {
            setAdminEditingId(null);
            setAdminFormData({ title: '', category: 'Hợp đồng', partner: '', dateSigned: new Date().toISOString().split('T')[0], expirationDate: '', status: 'Đang hiệu lực', fileLink: '' });
        }
        setIsAdminModalOpen(true);
    };

    const closeAdminModal = () => { setIsAdminModalOpen(false); setAdminEditingId(null); };

    // Lọc tài liệu hành chính
    const filteredDocs = documents.filter(doc => {
        const matchSearch = `${doc.title || ''} ${doc.partner || ''}`.toLowerCase().includes(adminSearchTerm.toLowerCase());
        const matchCategory = adminFilter === 'All' ? true : doc.category === adminFilter;
        return matchSearch && matchCategory;
    });

    // Thống kê tài liệu
    const countContract = documents.filter(d => d.category === 'Hợp đồng').length;
    const countLegal = documents.filter(d => d.category === 'Pháp lý').length;
    const countInternal = documents.filter(d => d.category === 'Nội bộ').length;

    // Kiểm tra hết hạn (< 30 ngày)
    const checkExpiration = (expDateString) => {
        if (!expDateString) return { isExpired: false, isWarning: false };
        const expDate = new Date(expDateString);
        const today = new Date();
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { isExpired: true, isWarning: false, text: 'Đã hết hạn' };
        if (diffDays <= 30) return { isExpired: false, isWarning: true, text: `Còn ${diffDays} ngày` };
        return { isExpired: false, isWarning: false, text: 'An toàn' };
    };

    return (
        <div className="min-h-screen bg-vps-black flex w-full max-w-[100vw] overflow-x-hidden relative">
            <Sidebar />

            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto w-full">
                {/* 1. HEADER CHUNG */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-vps-gold">Hành chính & Kế toán</h1>
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </div>
                        <p className="text-sm md:text-base text-vps-ivory opacity-60 mt-1">Quản lý dòng tiền, pháp lý và giấy tờ doanh nghiệp.</p>
                    </div>
                    {/* Nút ở header thay đổi theo tab đang mở */}
                    {activeTab === 'admin' ? (
                        <button onClick={() => openAdminModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-4 py-2.5 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-lg">
                            <Plus className="w-5 h-5" /> <span>Thêm Tài Liệu</span>
                        </button>
                    ) : (
                        <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-4 py-2.5 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-lg">
                            <Plus className="w-5 h-5" /> <span>Thêm Giao Dịch</span>
                        </button>
                    )}
                </div>

                {/* 2. THANH CHUYỂN TAB (Đã đưa Pháp lý lên trước) */}
                <div className="flex gap-4 mb-6 border-b border-vps-gray/40 pb-2">
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`pb-2 px-2 text-sm md:text-base font-bold transition-colors relative ${activeTab === 'admin' ? 'text-vps-gold' : 'text-gray-500 hover:text-vps-ivory'}`}
                    >
                        Pháp lý & Giấy tờ
                        {activeTab === 'admin' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-vps-gold rounded-t-full"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('accounting')}
                        className={`pb-2 px-2 text-sm md:text-base font-bold transition-colors relative ${activeTab === 'accounting' ? 'text-vps-gold' : 'text-gray-500 hover:text-vps-ivory'}`}
                    >
                        Kế toán nội bộ
                        {activeTab === 'accounting' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-vps-gold rounded-t-full"></span>}
                    </button>
                </div>

                {/* 3. NỘI DUNG TỪNG TAB */}
                {/* ===================== TAB HÀNH CHÍNH ===================== */}
                {activeTab === 'admin' ? (
                    <div className="animate-fadeIn">
                        {/* Thống kê File Hành Chính */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-4 flex items-center gap-4">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg"><Briefcase className="w-6 h-6" /></div>
                                <div><p className="text-sm text-gray-400">Hợp đồng đối tác</p><p className="text-xl font-bold text-vps-ivory">{countContract}</p></div>
                            </div>
                            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-4 flex items-center gap-4">
                                <div className="p-3 bg-amber-500/20 text-vps-gold rounded-lg"><Scale className="w-6 h-6" /></div>
                                <div><p className="text-sm text-gray-400">Hồ sơ Pháp lý</p><p className="text-xl font-bold text-vps-ivory">{countLegal}</p></div>
                            </div>
                            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-4 flex items-center gap-4">
                                <div className="p-3 bg-green-500/20 text-green-400 rounded-lg"><FileText className="w-6 h-6" /></div>
                                <div><p className="text-sm text-gray-400">Biểu mẫu Nội bộ</p><p className="text-xl font-bold text-vps-ivory">{countInternal}</p></div>
                            </div>
                        </div>

                        {/* Toolbar Lọc Hành Chính */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type="text" placeholder="Tìm kiếm tên tài liệu, đối tác..." value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} className="w-full bg-[#1E1E1E] border border-vps-gray rounded-lg pl-10 pr-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm" />
                            </div>
                            <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} className="bg-[#1E1E1E] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none min-w-[160px]">
                                <option value="All">Tất cả danh mục</option>
                                <option value="Hợp đồng">Hợp đồng kinh tế</option>
                                <option value="Pháp lý">Hồ sơ pháp lý</option>
                                <option value="Nội bộ">Biểu mẫu nội bộ</option>
                            </select>
                        </div>

                        {/* Bảng Dữ Liệu Hành Chính */}
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden w-full">
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#1A1A1A] border-b border-vps-gray text-vps-ivory/60 text-sm uppercase tracking-wider">
                                            <th className="p-4 font-medium">Tên Tài liệu / Hợp đồng</th>
                                            <th className="p-4 font-medium">Đối tác liên quan</th>
                                            <th className="p-4 font-medium">Thời hạn</th>
                                            <th className="p-4 font-medium text-center">Tệp đính kèm</th>
                                            <th className="p-4 font-medium text-center">Trạng thái</th>
                                            <th className="p-4 font-medium text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-vps-gray/40">
                                        {filteredDocs.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-12 text-center">
                                                    <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                                    <h3 className="text-vps-ivory font-bold mb-1">Kho lưu trữ trống</h3>
                                                    <p className="text-sm text-gray-500">Bấm "Thêm tài liệu" để bắt đầu quản lý hợp đồng và giấy tờ.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDocs.map(docItem => {
                                                const expirationStatus = checkExpiration(docItem.expirationDate);
                                                return (
                                                    <tr key={docItem.id} className="hover:bg-[#252525] transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-bold text-vps-gold text-sm mb-1">{docItem.title}</div>
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${docItem.category === 'Hợp đồng' ? 'bg-blue-500/20 text-blue-400' : docItem.category === 'Pháp lý' ? 'bg-amber-500/20 text-vps-gold' : 'bg-green-500/20 text-green-400'}`}>{docItem.category}</span>
                                                        </td>
                                                        <td className="p-4 text-sm text-vps-ivory/90">{docItem.partner || '-'}</td>
                                                        <td className="p-4 text-xs text-vps-ivory/70">
                                                            <div>Ký: {docItem.dateSigned}</div>
                                                            {docItem.expirationDate && (
                                                                <div className={`mt-1 flex items-center gap-1 ${expirationStatus.isExpired ? 'text-red-400 font-bold' : expirationStatus.isWarning ? 'text-orange-400 font-bold' : 'text-gray-500'}`}>
                                                                    {(expirationStatus.isExpired || expirationStatus.isWarning) && <AlertTriangle className="w-3 h-3" />}
                                                                    Hết hạn: {docItem.expirationDate}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {docItem.fileLink ? (
                                                                <a href={docItem.fileLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                                                    <ExternalLink className="w-3 h-3" /> Mở File
                                                                </a>
                                                            ) : <span className="text-xs text-gray-600">-</span>}
                                                        </td>
                                                        <td className="p-4 text-center"><span className="text-xs text-vps-ivory/70 border border-vps-gray px-2 py-1 rounded-md">{docItem.status}</span></td>
                                                        <td className="p-4">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button onClick={() => openAdminModal(docItem)} className="text-vps-gold opacity-70 hover:opacity-100"><Edit className="w-4 h-4" /></button>
                                                                <button onClick={() => handleAdminDelete(docItem.id, docItem.title)} className="text-red-400 opacity-70 hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bảng Hành Chính Mobile */}
                            <div className="block md:hidden divide-y divide-vps-gray/40">
                                {filteredDocs.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <FolderOpen className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">Chưa có tài liệu nào.</p>
                                    </div>
                                ) : (
                                    filteredDocs.map(docItem => {
                                        const expirationStatus = checkExpiration(docItem.expirationDate);
                                        return (
                                            <div key={docItem.id} className="p-4 flex flex-col gap-3 hover:bg-[#252525] transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-3">
                                                        <h3 className="text-sm font-bold text-vps-gold line-clamp-2">{docItem.title}</h3>
                                                        <p className="text-xs text-vps-ivory/80 mt-1">{docItem.partner || 'Nội bộ'}</p>
                                                    </div>
                                                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${docItem.category === 'Hợp đồng' ? 'bg-blue-500/20 text-blue-400' : docItem.category === 'Pháp lý' ? 'bg-amber-500/20 text-vps-gold' : 'bg-green-500/20 text-green-400'}`}>{docItem.category}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="text-vps-ivory/60">Ngày ký: {docItem.dateSigned}</div>
                                                    {docItem.fileLink && (
                                                        <a href={docItem.fileLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400">
                                                            <ExternalLink className="w-3 h-3" /> Mở
                                                        </a>
                                                    )}
                                                </div>
                                                {docItem.expirationDate && (
                                                    <div className={`text-xs flex items-center gap-1 ${expirationStatus.isExpired ? 'text-red-400 font-bold' : expirationStatus.isWarning ? 'text-orange-400 font-bold' : 'text-gray-500'}`}>
                                                        {(expirationStatus.isExpired || expirationStatus.isWarning) && <AlertTriangle className="w-3 h-3" />}
                                                        Hết hạn: {docItem.expirationDate} {expirationStatus.text !== 'An toàn' && `(${expirationStatus.text})`}
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center border-t border-vps-gray/30 pt-3 mt-1">
                                                    <span className="text-[10px] text-vps-ivory/70 border border-vps-gray px-2 py-1 rounded-md">{docItem.status}</span>
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => openAdminModal(docItem)} className="flex items-center gap-1 text-xs text-vps-gold"><Edit className="w-3.5 h-3.5" /> Sửa</button>
                                                        <button onClick={() => handleAdminDelete(docItem.id, docItem.title)} className="flex items-center gap-1 text-xs text-red-400"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===================== TAB KẾ TOÁN ===================== */
                    <div className="animate-fadeIn">
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type="text" placeholder="Tìm kiếm khách hàng, nội dung..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1E1E1E] border border-vps-gray rounded-lg pl-10 pr-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold transition-colors text-sm md:text-base" />
                            </div>
                            <div className="flex gap-2">
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full sm:w-auto bg-[#1E1E1E] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold appearance-none text-sm md:text-base">
                                    <option value="All">Tất cả giao dịch</option>
                                    <option value="Thu">Chỉ Thu</option>
                                    <option value="Chi">Chỉ Chi</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden w-full">
                            {/* Bảng Kế Toán Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#1A1A1A] border-b border-vps-gray text-vps-ivory/60 text-sm uppercase tracking-wider">
                                            <th className="p-4 font-medium">Ngày</th>
                                            <th className="p-4 font-medium">Khách hàng / Đối tác</th>
                                            <th className="p-4 font-medium text-right">Số tiền (VNĐ)</th>
                                            <th className="p-4 font-medium text-center">Loại</th>
                                            <th className="p-4 font-medium text-center">Trạng thái</th>
                                            <th className="p-4 font-medium text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-vps-gray/40">
                                        {loading ? <tr><td colSpan="6" className="p-8 text-center text-vps-gold/60">Đang nạp dữ liệu...</td></tr> :
                                            filteredTx.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-vps-ivory/40">Không tìm thấy giao dịch nào.</td></tr> :
                                                filteredTx.map(tx => (
                                                    <tr key={tx.id} className="hover:bg-[#252525] transition-colors">
                                                        <td className="p-4 text-sm text-vps-ivory/80">{tx.date}</td>
                                                        <td className="p-4 text-sm font-medium text-vps-ivory">{tx.client} {tx.description && <span className="block text-xs font-normal text-gray-500 mt-1">{tx.description}</span>}</td>
                                                        <td className={`p-4 text-sm font-bold text-right ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'Thu' ? '+' : '-'}{formatCurrency(tx.amount)}</td>
                                                        <td className="p-4 text-center"><span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-opacity-20 ${tx.type === 'Thu' ? 'bg-green-500 text-green-400' : 'bg-red-500 text-red-400'}`}>{tx.type}</span></td>
                                                        <td className="p-4 text-center"><span className="text-xs text-vps-ivory/70 border border-vps-gray px-2 py-1 rounded-md">{tx.status}</span></td>
                                                        <td className="p-4">
                                                            <div className="flex items-center justify-center gap-3">
                                                                {tx.isAutoSync ? <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">Auto</span> :
                                                                    <><button onClick={() => openModal(tx)} className="text-vps-gold opacity-70 hover:opacity-100"><Edit className="w-4 h-4" /></button>
                                                                        <button onClick={() => handleDelete(tx.id, tx.client)} className="text-red-400 opacity-70 hover:opacity-100"><Trash2 className="w-4 h-4" /></button></>}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Bảng Kế Toán Mobile */}
                            <div className="block md:hidden divide-y divide-vps-gray/40">
                                {loading ? <div className="p-8 text-center text-vps-gold/60 text-sm">Đang nạp dữ liệu...</div> :
                                    filteredTx.length === 0 ? <div className="p-8 text-center text-vps-ivory/40 text-sm">Không tìm thấy giao dịch.</div> :
                                        filteredTx.map(tx => (
                                            <div key={tx.id} className="p-4 flex flex-col gap-3 hover:bg-[#252525] transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-3">
                                                        <h3 className="text-sm font-bold text-vps-ivory line-clamp-2">{tx.client}</h3>
                                                        {tx.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{tx.description}</p>}
                                                        <p className="text-xs text-vps-ivory/60 mt-2">{tx.date}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className={`block text-base font-bold ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'Thu' ? '+' : '-'}{formatCurrency(tx.amount)}</span>
                                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-opacity-20 ${tx.type === 'Thu' ? 'bg-green-500 text-green-400' : 'bg-red-500 text-red-400'}`}>{tx.type}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-vps-gray/30 pt-3 mt-1">
                                                    <span className="text-[10px] sm:text-xs text-vps-ivory/70 border border-vps-gray px-2 py-1 rounded-md">{tx.status}</span>
                                                    <div className="flex items-center gap-4">
                                                        {tx.isAutoSync ? <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">Auto</span> :
                                                            <><button onClick={() => openModal(tx)} className="flex items-center gap-1 text-xs text-vps-gold"><Edit className="w-3.5 h-3.5" /> Sửa</button>
                                                                <button onClick={() => handleDelete(tx.id, tx.client)} className="flex items-center gap-1 text-xs text-red-400"><Trash2 className="w-3.5 h-3.5" /> Xóa</button></>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* MODAL KẾ TOÁN */}
                {/* ========================================== */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1E1E1E] border-b border-vps-gray p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">{editingId ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}</h2>
                                <button onClick={closeModal} className="text-vps-ivory/60 hover:text-vps-ivory p-1"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Loại *</label>
                                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none font-bold">
                                            <option value="Thu" className="text-green-400">Thu Tiền</option>
                                            <option value="Chi" className="text-red-400">Chi Tiền</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Ngày *</label>
                                        <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Khách hàng / Đối tác *</label>
                                    <input type="text" required value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm" placeholder="Tên đối tác hoặc khách hàng..." />
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Số tiền (VNĐ) *</label>
                                    <input type="number" required min="0" step="1000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm font-bold tracking-wider" placeholder="Ví dụ: 15000000" />
                                    {formData.amount && <p className="text-xs text-vps-gold/80 mt-1 italic">Hiển thị: {formatCurrency(formData.amount)}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Nội dung chi tiết</label>
                                    <textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm resize-none" placeholder="Mô tả khoản thu/chi..." />
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Trạng thái *</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none">
                                        <option value="Đã thanh toán">Đã thanh toán (Hoàn tất)</option>
                                        <option value="Chờ thanh toán">Chờ thanh toán (Công nợ)</option>
                                        <option value="Đã hủy">Đã hủy bỏ</option>
                                    </select>
                                </div>
                                <div className="pt-4 mt-2 border-t border-vps-gray flex gap-3">
                                    <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-vps-gray text-vps-ivory rounded-lg hover:bg-[#252525] transition-colors font-medium text-sm">Hủy</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 bg-vps-gold text-vps-black rounded-lg hover:bg-yellow-600 transition-colors font-bold text-sm flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" />{editingId ? 'Cập nhật' : 'Lưu giao dịch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* MODAL HÀNH CHÍNH & PHÁP LÝ */}
                {/* ========================================== */}
                {isAdminModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1E1E1E] border-b border-vps-gray p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">{adminEditingId ? 'Chỉnh sửa Tài liệu' : 'Thêm Tài liệu mới'}</h2>
                                <button onClick={closeAdminModal} className="text-vps-ivory/60 hover:text-vps-ivory p-1"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleAdminSave} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Tên tài liệu / Hợp đồng *</label>
                                    <input type="text" required value={adminFormData.title} onChange={(e) => setAdminFormData({ ...adminFormData, title: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm" placeholder="VD: Hợp đồng biểu diễn..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Phân loại *</label>
                                        <select value={adminFormData.category} onChange={(e) => setAdminFormData({ ...adminFormData, category: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none">
                                            <option value="Hợp đồng">Hợp đồng kinh tế</option>
                                            <option value="Pháp lý">Hồ sơ Pháp lý</option>
                                            <option value="Nội bộ">Biểu mẫu Nội bộ</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Đối tác liên quan</label>
                                        <input type="text" value={adminFormData.partner} onChange={(e) => setAdminFormData({ ...adminFormData, partner: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm" placeholder="Để trống nếu là nội bộ" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Ngày ký / Ban hành *</label>
                                        <input type="date" required value={adminFormData.dateSigned} onChange={(e) => setAdminFormData({ ...adminFormData, dateSigned: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Ngày hết hạn (Nếu có)</label>
                                        <input type="date" value={adminFormData.expirationDate} onChange={(e) => setAdminFormData({ ...adminFormData, expirationDate: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm text-gray-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Đường dẫn Google Drive (PDF/Doc)</label>
                                    <input type="url" value={adminFormData.fileLink} onChange={(e) => setAdminFormData({ ...adminFormData, fileLink: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm text-blue-400" placeholder="https://drive.google.com/..." />
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Trạng thái *</label>
                                    <select value={adminFormData.status} onChange={(e) => setAdminFormData({ ...adminFormData, status: e.target.value })} className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none">
                                        <option value="Đang hiệu lực">Đang hiệu lực</option>
                                        <option value="Chờ ký">Chờ ký kết</option>
                                        <option value="Đã thanh lý">Đã thanh lý</option>
                                        <option value="Đã hủy">Đã hủy bỏ</option>
                                    </select>
                                </div>
                                <div className="pt-4 mt-2 border-t border-vps-gray flex gap-3">
                                    <button type="button" onClick={closeAdminModal} className="flex-1 px-4 py-2.5 border border-vps-gray text-vps-ivory rounded-lg hover:bg-[#252525] transition-colors font-medium text-sm">Hủy</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 bg-vps-gold text-vps-black rounded-lg hover:bg-yellow-600 transition-colors font-bold text-sm flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" />{adminEditingId ? 'Cập nhật' : 'Lưu tài liệu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Accounting;