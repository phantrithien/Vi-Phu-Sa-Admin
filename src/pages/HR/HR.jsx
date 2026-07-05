import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import {
    UserPlus, Search, Filter, Edit, Trash2,
    Users, Briefcase, Phone, Mail, Award, X, Save, Cloud, Shield
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../../config/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const HR = () => {
    const { userRole } = useAuth();
    // Phân quyền: Chỉ Founder và Back Office (Kế toán/Nhân sự) mới được phép Thêm/Sửa/Xóa
    const canManageHR = ['founder', 'back_office'].includes(userRole);

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    // TỰ ĐỘNG ĐIỀN MẬT KHẨU MẶC ĐỊNH
    const [formData, setFormData] = useState({
        name: '', role: '', level: 'Nhân viên', department: '', phone: '', email: '', status: 'Đang làm việc', password: 'Viphusa@123'
    });

    useEffect(() => {
        const q = query(collection(db, 'employees'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Vá lỗi Logic: Xóa hồ sơ đồng thời Thu hồi quyền truy cập
    const handleDelete = async (id, name) => {
        if (window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa hồ sơ và THU HỒI QUYỀN TRUY CẬP của ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'employees', id)); // Xóa hồ sơ HR
                await deleteDoc(doc(db, 'users', id));     // Xóa quyền truy cập hệ thống
                alert("Đã xóa hồ sơ và thu hồi quyền truy cập thành công!");
            } catch (error) {
                console.error("Lỗi khi xóa:", error);
                alert("Đã xảy ra lỗi khi xóa!");
            }
        }
    };

    const determineSystemRole = (department, level) => {
        if (level === 'Ban Giám Đốc') return 'founder';
        if (level === 'Freelancer / CTV') return 'freelancer';

        if (department === 'Hành chính' || department === 'Kế toán' || department === 'Nhân sự' || department === 'Ban Giám Đốc') {
            return level === 'Trưởng phòng / Quản lý' ? 'back_office' : 'staff';
        } else {
            return level === 'Trưởng phòng / Quản lý' ? 'front_office' : 'staff';
        }
    };

    // Xử lý Lưu (Thêm/Sửa)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const assignedRole = determineSystemRole(formData.department, formData.level);

            if (editingId) {
                // UPDATE
                const { password, ...safeEmployeeData } = formData;
                await updateDoc(doc(db, 'employees', editingId), {
                    ...safeEmployeeData,
                    roleLevel: assignedRole,
                    updatedAt: Date.now()
                });
                await updateDoc(doc(db, 'users', editingId), {
                    role: assignedRole,
                    email: formData.email
                });
                alert("Cập nhật thông tin và cấp bậc thành công!");
            } else {
                // CREATE
                if (!formData.email || !formData.password) {
                    alert("Vui lòng nhập Email và Mật khẩu khởi tạo cho nhân viên mới!");
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
                const newUid = userCredential.user.uid;

                // Vá lỗi Logic: Đăng xuất tài khoản vừa tạo để giải phóng secondaryAuth
                await signOut(secondaryAuth);

                await setDoc(doc(db, 'users', newUid), {
                    email: formData.email,
                    role: assignedRole,
                    createdAt: Date.now()
                });

                const { password, ...safeEmployeeData } = formData;
                await setDoc(doc(db, 'employees', newUid), {
                    ...safeEmployeeData,
                    uid: newUid,
                    roleLevel: assignedRole,
                    createdAt: Date.now()
                });

                alert(`Đã tạo tài khoản thành công!\nEmail: ${formData.email}\nQuyền HT: ${assignedRole}`);
            }
            closeModal();
        } catch (error) {
            console.error("Lỗi thêm nhân sự:", error);
            if (error.code === 'auth/email-already-in-use') alert("Email này đã được sử dụng!");
            else alert("Đã xảy ra lỗi: " + error.message);
        }
    };

    const openModal = (emp = null) => {
        if (emp) {
            setEditingId(emp.id);
            setFormData({
                name: emp.name || '', role: emp.role || '', level: emp.level || 'Nhân viên',
                department: emp.department || '', phone: emp.phone || '', email: emp.email || '', status: emp.status || 'Đang làm việc'
            });
        } else {
            setEditingId(null);
            // TỰ ĐỘNG ĐIỀN MẬT KHẨU KHI MỞ FORM THÊM MỚI
            setFormData({ name: '', role: '', level: 'Nhân viên', department: '', phone: '', email: '', status: 'Đang làm việc', password: 'Viphusa@123' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

    const filteredData = employees.filter(emp => {
        const matchSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' ? true : emp.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const getStatusColor = (status) => {
        if (status === 'Đang làm việc') return 'bg-green-500/10 text-green-400 border-green-500/20';
        if (status === 'Nghỉ phép') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex w-full max-w-[100vw] overflow-x-hidden relative text-vps-ivory">
            <Sidebar />

            <div className="flex-1 md:ml-64 p-5 pt-24 md:p-10 md:pt-10 overflow-y-auto w-full">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold drop-shadow-md">Nhân sự & Đào tạo</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                <Cloud className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Đã đồng bộ</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Quản lý hồ sơ, cấp bậc và phân quyền truy cập hệ thống.</p>
                    </div>
                    {canManageHR && (
                        <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                            <UserPlus className="w-5 h-5" />
                            <span>Thêm Nhân Sự Mới</span>
                        </button>
                    )}
                </div>

                {/* ANALYTICS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-vps-gold/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-vps-gold/5 rounded-full blur-2xl group-hover:bg-vps-gold/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng nhân sự</p><h3 className="text-3xl font-bold text-vps-gold">{employees.length}</h3></div>
                            <div className="p-3 bg-vps-gold/10 rounded-xl border border-vps-gold/20"><Users className="w-6 h-6 text-vps-gold" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đang hoạt động</p><h3 className="text-3xl font-bold text-green-400">{employees.filter(e => e.status === 'Đang làm việc').length}</h3></div>
                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><Award className="w-6 h-6 text-green-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Cấp Quản Lý</p><h3 className="text-3xl font-bold text-blue-400">{employees.filter(e => e.level === 'Trưởng phòng / Quản lý' || e.level === 'Ban Giám Đốc').length}</h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><Shield className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                </div>

                {/* SEARCH & FILTER */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text" placeholder="Tìm tên nhân viên, chức danh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors"
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <select
                            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full appearance-none h-full px-5 py-3.5 pr-10 bg-[#1A1A1A] border border-vps-gray/20 rounded-xl text-vps-ivory hover:border-vps-gold/50 focus:outline-none focus:border-vps-gold transition-colors cursor-pointer text-sm font-semibold"
                        >
                            <option value="All">Tất cả trạng thái</option>
                            <option value="Đang làm việc">Đang làm việc</option>
                            <option value="Nghỉ phép">Nghỉ phép</option>
                            <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* BẢNG DỮ LIỆU */}
                <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden animate-fadeIn mb-10">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Nhân viên</th>
                                    <th className="p-5 font-semibold">Chức vụ & Cấp bậc</th>
                                    <th className="p-5 font-semibold">Thông tin Liên hệ</th>
                                    <th className="p-5 font-semibold text-center">Trạng thái</th>
                                    {canManageHR && <th className="p-5 font-semibold text-center">Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-vps-gray/10">
                                {loading ? (
                                    <tr><td colSpan={canManageHR ? "5" : "4"} className="p-8 text-center text-vps-gold/60 font-semibold animate-pulse">Đang tải hồ sơ...</td></tr>
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={canManageHR ? "5" : "4"} className="p-8 text-center text-gray-500 font-medium">Không tìm thấy hồ sơ nào.</td></tr>
                                ) : (
                                    filteredData.map(emp => (
                                        <tr key={emp.id} className="hover:bg-[#222] transition-colors group">
                                            <td className="p-5 text-sm font-bold text-vps-gold text-base group-hover:text-white transition-colors">{emp.name}</td>
                                            <td className="p-5 text-sm text-vps-ivory/80">
                                                <div className="font-bold text-vps-ivory flex items-center gap-2 mb-1">
                                                    {emp.role}
                                                    {emp.level === 'Trưởng phòng / Quản lý' && <span className="bg-vps-gold/10 text-vps-gold text-[9px] px-2 py-0.5 rounded border border-vps-gold/20 uppercase">Quản lý</span>}
                                                    {emp.level === 'Ban Giám Đốc' && <span className="bg-red-500/10 text-red-400 text-[9px] px-2 py-0.5 rounded border border-red-500/20 uppercase">Founder</span>}
                                                    {emp.level === 'Freelancer / CTV' && <span className="bg-purple-500/10 text-purple-400 text-[9px] px-2 py-0.5 rounded border border-purple-500/20 uppercase">CTV</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">{emp.department}</div>
                                            </td>
                                            <td className="p-5 text-sm text-vps-ivory/80">
                                                <div className="flex items-center gap-2 font-medium mb-1.5"><Phone className="w-3.5 h-3.5 text-vps-gold/60" /> {emp.phone}</div>
                                                <div className="flex items-center gap-2 font-medium"><Mail className="w-3.5 h-3.5 text-vps-gold/60" /> {emp.email}</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(emp.status)}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                            {canManageHR && (
                                                <td className="p-5 flex justify-center gap-4 mt-1">
                                                    <button onClick={() => openModal(emp)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(emp.id, emp.name)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                        {loading ? (
                            <div className="p-8 text-center text-vps-gold/60 font-semibold animate-pulse">Đang tải hồ sơ...</div>
                        ) : filteredData.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 font-medium">Không tìm thấy hồ sơ nào.</div>
                        ) : (
                            filteredData.map(emp => (
                                <div key={emp.id} className="p-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-3">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-lg font-bold text-vps-gold">{emp.name}</h3>
                                                {['Trưởng phòng / Quản lý', 'Ban Giám Đốc'].includes(emp.level) && <Shield className="w-4 h-4 text-vps-gold" />}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                <span>{emp.role} • <span className="text-vps-ivory/60">{emp.department}</span></span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(emp.status)}`}>
                                            {emp.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 bg-[#222] p-3.5 rounded-xl border border-vps-gray/10">
                                        <div className="flex items-center gap-3 text-sm font-medium"><Phone className="w-4 h-4 text-vps-gold/60" /> <a href={`tel:${emp.phone}`}>{emp.phone}</a></div>
                                        <div className="flex items-center gap-3 text-sm font-medium"><Mail className="w-4 h-4 text-vps-gold/60" /> <a href={`mailto:${emp.email}`} className="truncate">{emp.email}</a></div>
                                    </div>
                                    {canManageHR && (
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button onClick={() => openModal(emp)} className="px-4 py-2 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                            <button onClick={() => handleDelete(emp.id, emp.name)} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* MODAL THÊM / SỬA */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-vps-gray/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold">
                                    {editingId ? 'Chỉnh Sửa Hồ Sơ' : 'Khởi Tạo Tài Khoản Mới'}
                                </h2>
                                <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-7 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Họ và tên *</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="Nguyễn Văn A..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Chức danh *</label>
                                        <input type="text" required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="Quay phim..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Cấp bậc *</label>
                                        <select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none font-bold transition-colors">
                                            <option value="Nhân viên">Nhân viên</option>
                                            <option value="Trưởng phòng / Quản lý" className="text-vps-gold">Quản lý</option>
                                            <option value="Ban Giám Đốc" className="text-red-400">Ban Giám Đốc</option>
                                            <option value="Freelancer / CTV">Freelancer / CTV</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phòng ban *</label>
                                        <select required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors">
                                            <option value="">Chọn phòng ban</option>
                                            <option value="Sản xuất">Sản xuất</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Hành chính">Hành chính</option>
                                            <option value="Kế toán">Kế toán</option>
                                            <option value="Nhân sự">Nhân sự</option>
                                            <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Số điện thoại</label>
                                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="0909..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Trạng thái làm việc</label>
                                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors">
                                            <option value="Đang làm việc">Đang làm việc</option>
                                            <option value="Nghỉ phép">Nghỉ phép</option>
                                            <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email Đăng Nhập *</label>
                                    <input type="email" required={!editingId} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" placeholder="email@viphusa.com" />
                                </div>

                                {!editingId && (
                                    <div>
                                        <label className="block text-xs font-bold text-vps-gold mb-2 uppercase tracking-wider">Mật khẩu khởi tạo *</label>
                                        <input type="text" required value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[#111] border border-vps-gold/50 rounded-xl p-3.5 text-vps-gold focus:outline-none transition-colors" placeholder="Ví dụ: Viphusa@123" />
                                        <p className="text-xs text-gray-500 mt-2 font-medium">Mật khẩu này được dùng để đăng nhập và cấp quyền hệ thống dựa trên chức vụ phía trên.</p>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-vps-gray/20 flex gap-4">
                                    <button type="button" onClick={closeModal} className="w-1/3 px-4 py-4 bg-[#222] border border-vps-gray/20 text-vps-ivory rounded-xl font-bold hover:bg-[#333] transition-colors">Hủy</button>
                                    <button type="submit" className="w-2/3 px-4 py-4 bg-vps-gold text-vps-black rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                                        <Save className="w-5 h-5" /> {editingId ? 'Cập Nhật Hồ Sơ' : 'Tạo Tài Khoản'}
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