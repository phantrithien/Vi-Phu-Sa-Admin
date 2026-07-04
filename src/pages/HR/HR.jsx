import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    UserPlus, Search, Filter, Edit, Trash2,
    Users, Briefcase, Phone, Mail, Award, X, Save, Cloud
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const HR = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Quản lý trạng thái Modal Thêm/Sửa
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: '',
        phone: '',
        email: '',
        status: 'Đang làm việc'
    });

    // Nạp dữ liệu thực tế từ Firebase
    useEffect(() => {
        const q = query(collection(db, 'employees'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Xử lý Xóa nhân sự
    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ của nhân sự: ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'employees', id));
            } catch (error) {
                console.error("Lỗi khi xóa nhân sự:", error);
                alert("Đã xảy ra lỗi khi xóa!");
            }
        }
    };

    // Xử lý Lưu (Thêm mới hoặc Cập nhật)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Cập nhật
                const empRef = doc(db, 'employees', editingId);
                await updateDoc(empRef, formData);
            } else {
                // Thêm mới
                await addDoc(collection(db, 'employees'), formData);
            }
            closeModal();
        } catch (error) {
            console.error("Lỗi khi lưu thông tin:", error);
            alert("Đã xảy ra lỗi khi lưu thông tin!");
        }
    };

    // Mở Modal
    const openModal = (emp = null) => {
        if (emp) {
            setEditingId(emp.id);
            setFormData({
                name: emp.name || '',
                role: emp.role || '',
                department: emp.department || '',
                phone: emp.phone || '',
                email: emp.email || '',
                status: emp.status || 'Đang làm việc'
            });
        } else {
            setEditingId(null);
            setFormData({ name: '', role: '', department: '', phone: '', email: '', status: 'Đang làm việc' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // Lọc dữ liệu
    const filteredData = employees.filter(emp => {
        const matchSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' ? true : emp.status === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="min-h-screen bg-vps-black flex w-full max-w-[100vw] overflow-x-hidden">
            <Sidebar />

            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto w-full relative">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-vps-gold">Nhân sự & Đào tạo</h1>
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </div>
                        <p className="text-sm md:text-base text-vps-ivory opacity-60 mt-1">Quản lý hồ sơ, phòng ban và hiệu suất nhân viên.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-4 py-2.5 rounded-lg font-semibold hover:bg-yellow-600 transition-colors shadow-lg"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Thêm Nhân Sự</span>
                    </button>
                </div>

                {/* Thống kê nhanh */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 md:p-5 rounded-xl">
                        <div className="flex items-center gap-2 text-vps-gold mb-2">
                            <Users className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm font-medium">Tổng nhân sự</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-vps-ivory">{employees.length}</p>
                    </div>
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 md:p-5 rounded-xl">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Award className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm font-medium">Đang làm việc</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-vps-ivory">
                            {employees.filter(e => e.status === 'Đang làm việc').length}
                        </p>
                    </div>
                </div>

                {/* Toolbar Lọc */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Tìm tên nhân viên, vị trí..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1E1E1E] border border-vps-gray rounded-lg pl-10 pr-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold transition-colors text-sm md:text-base"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full sm:w-auto bg-[#1E1E1E] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold appearance-none text-sm md:text-base"
                        >
                            <option value="All">Tất cả trạng thái</option>
                            <option value="Đang làm việc">Đang làm việc</option>
                            <option value="Nghỉ phép">Nghỉ phép</option>
                            <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                        </select>
                    </div>
                </div>

                {/* Danh sách */}
                <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden w-full">
                    {/* 1. Desktop Layout */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1A1A1A] border-b border-vps-gray text-vps-ivory/60 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-medium">Nhân viên</th>
                                    <th className="p-4 font-medium">Chức vụ & Phòng ban</th>
                                    <th className="p-4 font-medium">Liên hệ</th>
                                    <th className="p-4 font-medium text-center">Trạng thái</th>
                                    <th className="p-4 font-medium text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-vps-gray/40">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-vps-gold/60">Đang nạp dữ liệu...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-vps-ivory/40">Không tìm thấy hồ sơ nào.</td></tr>
                                ) : (
                                    filteredData.map(emp => (
                                        <tr key={emp.id} className="hover:bg-[#252525] transition-colors">
                                            <td className="p-4 text-sm font-medium text-vps-gold">{emp.name}</td>
                                            <td className="p-4 text-sm text-vps-ivory/80">
                                                <div className="font-medium">{emp.role}</div>
                                                <div className="text-xs text-gray-500 mt-1">{emp.department}</div>
                                            </td>
                                            <td className="p-4 text-sm text-vps-ivory/80">
                                                <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /> {emp.phone}</div>
                                                <div className="flex items-center gap-2 mt-1"><Mail className="w-3 h-3 text-gray-400" /> {emp.email}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-opacity-20 ${emp.status === 'Đang làm việc' ? 'bg-green-500 text-green-400' : 'bg-gray-500 text-gray-400'}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => openModal(emp)} className="text-vps-gold opacity-70 hover:opacity-100"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(emp.id, emp.name)} className="text-red-400 opacity-70 hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. Mobile Layout */}
                    <div className="block md:hidden divide-y divide-vps-gray/40">
                        {loading ? (
                            <div className="p-8 text-center text-vps-gold/60 text-sm">Đang nạp dữ liệu...</div>
                        ) : filteredData.length === 0 ? (
                            <div className="p-8 text-center text-vps-ivory/40 text-sm">Không tìm thấy hồ sơ nào.</div>
                        ) : (
                            filteredData.map(emp => (
                                <div key={emp.id} className="p-4 flex flex-col gap-3 hover:bg-[#252525] transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-3">
                                            <h3 className="text-base font-bold text-vps-gold">{emp.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-vps-ivory/80 mt-1">
                                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{emp.role} • <span className="text-gray-400">{emp.department}</span></span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-block px-2 py-1 rounded text-[10px] font-bold bg-opacity-20 ${emp.status === 'Đang làm việc' ? 'bg-green-500 text-green-400' : 'bg-gray-500 text-gray-400'}`}>
                                            {emp.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 mt-1 p-3 bg-[#1A1A1A] rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-vps-ivory/80">
                                            <Phone className="w-4 h-4 text-vps-gold/60" />
                                            <a href={`tel:${emp.phone}`} className="hover:text-vps-gold">{emp.phone}</a>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-vps-ivory/80">
                                            <Mail className="w-4 h-4 text-vps-gold/60" />
                                            <a href={`mailto:${emp.email}`} className="truncate hover:text-vps-gold">{emp.email}</a>
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center border-t border-vps-gray/30 pt-3 mt-1 gap-4">
                                        <button onClick={() => openModal(emp)} className="flex items-center gap-1 text-xs font-medium text-vps-gold opacity-80 hover:opacity-100 px-2 py-1">
                                            <Edit className="w-4 h-4" /> Sửa
                                        </button>
                                        <button onClick={() => handleDelete(emp.id, emp.name)} className="flex items-center gap-1 text-xs font-medium text-red-400 opacity-80 hover:opacity-100 px-2 py-1">
                                            <Trash2 className="w-4 h-4" /> Xóa
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL THÊM / SỬA NHÂN SỰ */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        {/* Wrapper của Modal: Full width trên mobile, có max-w trên desktop */}
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1E1E1E] border-b border-vps-gray p-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">
                                    {editingId ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
                                </h2>
                                <button onClick={closeModal} className="text-vps-ivory/60 hover:text-vps-ivory p-1">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Họ và tên *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                        placeholder="Nhập họ và tên..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Chức vụ *</label>
                                        <input
                                            type="text" required
                                            value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                            placeholder="Vd: Quay phim"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Phòng ban *</label>
                                        <select
                                            value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none"
                                            required
                                        >
                                            <option value="">Chọn phòng ban</option>
                                            <option value="Sản xuất">Sản xuất</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Hành chính">Hành chính</option>
                                            <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                        placeholder="Nhập số điện thoại"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                        placeholder="email@viphusa.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Trạng thái làm việc</label>
                                    <select
                                        value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none"
                                    >
                                        <option value="Đang làm việc">Đang làm việc</option>
                                        <option value="Nghỉ phép">Nghỉ phép</option>
                                        <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                                    </select>
                                </div>

                                {/* Action Buttons */}
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
                                        {editingId ? 'Cập nhật' : 'Lưu hồ sơ'}
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

export default HR;