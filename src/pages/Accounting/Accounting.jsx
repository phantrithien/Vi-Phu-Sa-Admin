import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Plus, Search, Filter, Edit, Trash2,
    TrendingUp, TrendingDown, Wallet, Cloud, X, Save
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Accounting = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [marketingExpense, setMarketingExpense] = useState(0);

    // Quản lý trạng thái Modal Thêm/Sửa
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

    useEffect(() => {
        const unsubMarketing = onSnapshot(doc(db, 'accounting_sync', 'marketing_expenses'), (docSnap) => {
            if (docSnap.exists()) {
                // Tự động nhận số tiền Ngân sách tổng từ Marketing chuyển sang
                setMarketingExpense(docSnap.data().amount || 0);
            }
        });
        return () => unsubMarketing();
    }, []);

    // Lọc ra các giao dịch là "Chi" từ state transactions hiện tại
    const localExpensesList = transactions.filter(tx => tx.type === 'Chi');

    // Cộng tổng tiền chi nội bộ với tổng tiền marketing đồng bộ sang
    const totalExpenses = localExpensesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) + marketingExpense;

    // Lấy dữ liệu từ Firebase
    useEffect(() => {
        const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Xử lý Xóa giao dịch
    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa giao dịch: ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'transactions', id));
            } catch (error) {
                console.error("Lỗi khi xóa giao dịch:", error);
                alert("Đã xảy ra lỗi khi xóa!");
            }
        }
    };

    // Xử lý Lưu (Thêm mới hoặc Cập nhật)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Chuẩn hóa số tiền (chỉ lấy số)
            const amountStr = formData.amount.toString();
            const amountNum = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

            const payload = {
                ...formData,
                amount: amountNum,
                timestamp: editingId ? formData.timestamp : Date.now() // Giữ nguyên timestamp nếu đang sửa
            };

            if (editingId) {
                // Cập nhật
                const txRef = doc(db, 'transactions', editingId);
                await updateDoc(txRef, payload);
            } else {
                // Thêm mới
                await addDoc(collection(db, 'transactions'), payload);
            }
            closeModal();
        } catch (error) {
            console.error("Lỗi khi lưu giao dịch:", error);
            alert("Đã xảy ra lỗi khi lưu thông tin!");
        }
    };

    // Mở/Đóng Modal
    const openModal = (tx = null) => {
        if (tx) {
            setEditingId(tx.id);
            setFormData({
                date: tx.date || new Date().toISOString().split('T')[0],
                client: tx.client || '',
                description: tx.description || '',
                amount: tx.amount ? tx.amount.toString() : '',
                type: tx.type || 'Thu',
                status: tx.status || 'Đã thanh toán',
                timestamp: tx.timestamp || Date.now()
            });
        } else {
            setEditingId(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                client: '',
                description: '',
                amount: '',
                type: 'Thu',
                status: 'Đã thanh toán'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    // Tạo một "giao dịch tự động" từ dữ liệu Marketing
    const marketingTx = {
        id: 'sync-marketing',
        date: new Date().toISOString().split('T')[0], // Lấy ngày hiện tại
        client: 'Phòng Marketing (Auto)',
        description: 'Đồng bộ tự động tổng tiền đã giải ngân Ads',
        amount: marketingExpense,
        type: 'Chi',
        status: 'Đã thanh toán',
        isAutoSync: true // Cờ đánh dấu đây là dữ liệu tự động, không cho xóa/sửa
    };

    // Gộp giao dịch marketing vào đầu danh sách (nếu số tiền > 0)
    const combinedTransactions = marketingExpense > 0 ? [marketingTx, ...transactions] : transactions;

    // Lọc dữ liệu trên danh sách đã gộp
    const filteredData = combinedTransactions.filter(tx => {
        const searchTarget = `${tx.client || ''} ${tx.description || ''}`.toLowerCase();
        const matchSearch = searchTarget.includes(searchTerm.toLowerCase());
        const matchType = filterType === 'All' ? true : tx.type === filterType;
        return matchSearch && matchType;
    });

    return (
        <div className="min-h-screen bg-vps-black flex w-full max-w-[100vw] overflow-x-hidden relative">
            <Sidebar />

            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto w-full">

                {/* Header đã tích hợp Cloud Icon */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-vps-gold">Hành chính và kế toán</h1>
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </div>
                        <p className="text-sm md:text-base text-vps-ivory opacity-60 mt-1">Theo dõi dòng tiền và giao dịch nội bộ.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-4 py-2.5 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Thêm Giao Dịch</span>
                    </button>
                </div>

                {/* Toolbar Lọc */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm khách hàng, nội dung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1E1E1E] border border-vps-gray rounded-lg pl-10 pr-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold transition-colors text-sm md:text-base"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full sm:w-auto bg-[#1E1E1E] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold appearance-none text-sm md:text-base"
                        >
                            <option value="All">Tất cả giao dịch</option>
                            <option value="Thu">Chỉ Thu</option>
                            <option value="Chi">Chỉ Chi</option>
                        </select>
                    </div>
                </div>

                {/* Vùng hiển thị Dữ liệu */}
                <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden w-full">

                    {/* 1. Giao diện Desktop: Bảng */}
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
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-vps-gold/60">Đang nạp dữ liệu...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-vps-ivory/40">Không tìm thấy giao dịch nào.</td></tr>
                                ) : (
                                    filteredData.map(tx => (
                                        <tr key={tx.id} className="hover:bg-[#252525] transition-colors">
                                            <td className="p-4 text-sm text-vps-ivory/80">{tx.date}</td>
                                            <td className="p-4 text-sm font-medium text-vps-ivory">
                                                {tx.client}
                                                {tx.description && <span className="block text-xs font-normal text-gray-500 mt-1">{tx.description}</span>}
                                            </td>
                                            <td className={`p-4 text-sm font-bold text-right ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.type === 'Thu' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-opacity-20 ${tx.type === 'Thu' ? 'bg-green-500 text-green-400' : 'bg-red-500 text-red-400'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-xs text-vps-ivory/70 border border-vps-gray px-2 py-1 rounded-md">{tx.status}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    {tx.isAutoSync ? (
                                                        <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded">Auto</span>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => openModal(tx)} className="text-vps-gold opacity-70 hover:opacity-100"><Edit className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDelete(tx.id, tx.client || 'Giao dịch không tên')} className="text-red-400 opacity-70 hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. Giao diện Mobile: Card */}
                    <div className="block md:hidden divide-y divide-vps-gray/40">
                        {loading ? (
                            <div className="p-8 text-center text-vps-gold/60 text-sm">Đang nạp dữ liệu...</div>
                        ) : filteredData.length === 0 ? (
                            <div className="p-8 text-center text-vps-ivory/40 text-sm">Không tìm thấy giao dịch nào.</div>
                        ) : (
                            filteredData.map(tx => (
                                <div key={tx.id} className="p-4 flex flex-col gap-3 hover:bg-[#252525] transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-3">
                                            <h3 className="text-sm font-bold text-vps-ivory line-clamp-2">{tx.client || 'Không tên'}</h3>
                                            {tx.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{tx.description}</p>}
                                            <p className="text-xs text-vps-ivory/60 mt-2">{tx.date}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`block text-base font-bold ${tx.type === 'Thu' ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.type === 'Thu' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </span>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-opacity-20 ${tx.type === 'Thu' ? 'bg-green-500 text-green-400' : 'bg-red-500 text-red-400'}`}>
                                                {tx.type}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-vps-gray/30 pt-3 mt-1">
                                        <span className="text-[10px] sm:text-xs text-vps-ivory/70 border border-vps-gray px-2 py-1 rounded-md">{tx.status}</span>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => openModal(tx)} className="flex items-center gap-1 text-xs font-medium text-vps-gold opacity-80 hover:opacity-100">
                                                <Edit className="w-3.5 h-3.5" /> Sửa
                                            </button>
                                            <button onClick={() => handleDelete(tx.id, tx.client || 'Giao dịch không tên')} className="flex items-center gap-1 text-xs font-medium text-red-400 opacity-80 hover:opacity-100">
                                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL THÊM / SỬA GIAO DỊCH */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1E1E1E] border-b border-vps-gray p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">
                                    {editingId ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
                                </h2>
                                <button onClick={closeModal} className="text-vps-ivory/60 hover:text-vps-ivory p-1">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Loại *</label>
                                        <select
                                            value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none font-bold"
                                        >
                                            <option value="Thu" className="text-green-400">Thu Tiền</option>
                                            <option value="Chi" className="text-red-400">Chi Tiền</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Ngày *</label>
                                        <input
                                            type="date" required
                                            value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Khách hàng / Đối tác *</label>
                                    <input
                                        type="text" required
                                        value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                        placeholder="Tên đối tác hoặc khách hàng..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Số tiền (VNĐ) *</label>
                                    <input
                                        type="number" required min="0" step="1000"
                                        value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm font-bold tracking-wider"
                                        placeholder="Ví dụ: 15000000"
                                    />
                                    {formData.amount && (
                                        <p className="text-xs text-vps-gold/80 mt-1 italic">
                                            Hiển thị: {formatCurrency(formData.amount)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Nội dung chi tiết</label>
                                    <textarea
                                        rows="2"
                                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm resize-none"
                                        placeholder="Mô tả khoản thu/chi..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Trạng thái *</label>
                                    <select
                                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none"
                                    >
                                        <option value="Đã thanh toán">Đã thanh toán (Hoàn tất)</option>
                                        <option value="Chờ thanh toán">Chờ thanh toán (Công nợ)</option>
                                        <option value="Đã hủy">Đã hủy bỏ</option>
                                    </select>
                                </div>

                                {/* Nút thao tác */}
                                <div className="pt-4 mt-2 border-t border-vps-gray flex gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2.5 border border-vps-gray text-vps-ivory rounded-lg hover:bg-[#252525] transition-colors font-medium text-sm"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 bg-vps-gold text-vps-black rounded-lg hover:bg-yellow-600 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {editingId ? 'Cập nhật' : 'Lưu giao dịch'}
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