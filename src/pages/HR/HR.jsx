import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    UserPlus, Search, Filter, Edit, Trash2,
    Users, Briefcase, Phone, Mail, Award, X, Save, Cloud, Shield
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
        role: '',       // Chức danh chuyên môn (VD: Quay phim, Kế toán viên)
        level: 'Nhân viên', // Cấp bậc quản lý (VD: Quản lý, Nhân viên)
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

    // Hàm phân quyền chính xác tuyệt đối dựa vào Cấp Bậc (Dropdown) và Phòng Ban
    const determineSystemRole = (department, level) => {
        if (level === 'Ban Giám Đốc') return 'founder';
        if (level === 'Freelancer / CTV') return 'freelancer';

        if (department === 'Hành chính' || department === 'Kế toán' || department === 'Nhân sự' || department === 'Ban Giám Đốc') {
            return level === 'Trưởng phòng / Quản lý' ? 'back_office' : 'staff';
        } else {
            return level === 'Trưởng phòng / Quản lý' ? 'front_office' : 'staff';
        }
    };

    // Xử lý Lưu (Thêm mới hoặc Cập nhật)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const assignedRole = determineSystemRole(formData.department, formData.level);

            if (editingId) {
                // 1. Cập nhật nhân sự đã có
                await updateDoc(doc(db, 'employees', editingId), {
                    ...formData,
                    roleLevel: assignedRole, // Cấp quyền hệ thống
                    updatedAt: Date.now()
                });

                // Cập nhật quyền bên bảng users 
                await updateDoc(doc(db, 'users', editingId), {
                    role: assignedRole
                });

                alert("Cập nhật thông tin và cấp bậc thành công!");
            } else {
                // 2. Thêm nhân sự mới
                if (!formData.email || !formData.password) {
                    alert("Vui lòng nhập Email và Mật khẩu khởi tạo cho nhân viên mới!");
                    return;
                }

                // Tạo tài khoản bằng Secondary Auth
                const userCredential = await createUserWithEmailAndPassword(
                    secondaryAuth,
                    formData.email,
                    formData.password
                );
                const newUid = userCredential.user.uid;

                // Lưu quyền vào collection 'users'
                await setDoc(doc(db, 'users', newUid), {
                    email: formData.email,
                    role: assignedRole,
                    createdAt: Date.now()
                });

                // Lưu hồ sơ vào collection 'employees'
                const { password, ...safeEmployeeData } = formData;
                await setDoc(doc(db, 'employees', newUid), {
                    ...safeEmployeeData,
                    uid: newUid,
                    roleLevel: assignedRole,
                    createdAt: Date.now()
                });

                alert(`Đã tạo tài khoản thành công!\nEmail: ${formData.email}\nCấp bậc: ${formData.level}`);
            }

            closeModal();
        } catch (error) {
            console.error("Lỗi khi thêm nhân sự:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("Email này đã được sử dụng. Vui lòng chọn email khác!");
            } else {
                alert("Đã xảy ra lỗi: " + error.message);
            }
        }
    };

    // Mở Modal
    const openModal = (emp = null) => {
        if (emp) {
            setEditingId(emp.id);
            setFormData({
                name: emp.name || '',
                role: emp.role || '',
                level: emp.level || 'Nhân viên', // Gắn level hiện tại
                department: emp.department || '',
                phone: emp.phone || '',
                email: emp.email || '',
                status: emp.status || 'Đang làm việc'
            });
        } else {
            setEditingId(null);
            setFormData({ name: '', role: '', level: 'Nhân viên', department: '', phone: '', email: '', status: 'Đang làm việc', password: '' });
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
                        <p className="text-sm md:text-base text-vps-ivory opacity-60 mt-1">Quản lý hồ sơ, cấp bậc và hiệu suất nhân viên.</p>
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
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 md:p-5 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Shield className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm font-medium">Cấp Quản lý</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-vps-ivory">
                            {employees.filter(e => e.level === 'Trưởng phòng / Quản lý' || e.level === 'Ban Giám Đốc').length}
                        </p>
                    </div>
                </div>

                {/* Toolbar Lọc */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Tìm tên nhân viên, chức danh..."
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
                                    <th className="p-4 font-medium">Chức vụ & Cấp bậc</th>
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
                                                <div className="font-medium text-vps-ivory flex items-center gap-2">
                                                    {emp.role}
                                                    {/* Nhãn Quản lý nổi bật */}
                                                    {emp.level === 'Trưởng phòng / Quản lý' && <span className="bg-vps-gold/20 text-vps-gold text-[10px] px-1.5 py-0.5 rounded border border-vps-gold/30">Quản lý</span>}
                                                    {emp.level === 'Ban Giám Đốc' && <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30">Founder</span>}
                                                    {emp.level === 'Freelancer / CTV' && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30">CTV</span>}
                                                </div>
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
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-vps-gold">{emp.name}</h3>
                                                {emp.level === 'Trưởng phòng / Quản lý' && <Shield className="w-3.5 h-3.5 text-vps-gold" />}
                                            </div>
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
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
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

                                {/* CHIA LÀM 3 CỘT ĐỂ RÕ RÀNG: Chức danh - Cấp bậc - Phòng ban */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Chức danh *</label>
                                        <input
                                            type="text" required
                                            value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                            placeholder="Vd: Quay phim, Editor..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Cấp bậc *</label>
                                        <select
                                            value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm appearance-none font-bold"
                                        >
                                            <option value="Nhân viên">Nhân viên</option>
                                            <option value="Trưởng phòng / Quản lý" className="text-vps-gold">Trưởng phòng / Quản lý</option>
                                            <option value="Ban Giám Đốc" className="text-red-400">Ban Giám Đốc</option>
                                            <option value="Freelancer / CTV">Freelancer / CTV</option>
                                        </select>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </div>

                                <div>
                                    <label className="block text-sm text-vps-ivory/80 mb-1">Email</label>
                                    <input
                                        type="email" required={!editingId}
                                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                        placeholder="email@viphusa.com"
                                    />
                                </div>

                                {!editingId && (
                                    <div>
                                        <label className="block text-sm text-vps-ivory/80 mb-1">Mật khẩu khởi tạo *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.password || ''}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg px-4 py-2.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm"
                                            placeholder="Ví dụ: Viphusa@123"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Mật khẩu này sẽ được dùng để nhân viên đăng nhập, và quyết định quyền hạn của họ vào hệ thống.</p>
                                    </div>
                                )}

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