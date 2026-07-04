import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { Camera, CalendarDays, Wrench, Video, Plus, Trash2, Cloud, Pencil, MapPin, Clock, Image } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Production = () => {
    const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' hoặc 'schedule'

    // --- STATE KHO THIẾT BỊ ---
    const [equipmentList, setEquipmentList] = useState([]);
    const [loadingEq, setLoadingEq] = useState(true);
    const [isEqModalOpen, setIsEqModalOpen] = useState(false);
    const [eqFormData, setEqFormData] = useState({ name: '', category: 'Camera', status: 'available' });
    const [isEditEqModalOpen, setIsEditEqModalOpen] = useState(false);
    const [editEqFormData, setEditEqFormData] = useState({ id: '', name: '', category: '', status: '' });

    // State cho hình ảnh của Modal Sửa
    const [editEqImageFile, setEditEqImageFile] = useState(null);
    const [editEqImagePreview, setEditEqImagePreview] = useState(null);

    // Hàm xử lý khi chọn ảnh mới trong form Sửa
    const handleEditImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditEqImageFile(file);
            setEditEqImagePreview(URL.createObjectURL(file));
        }
    };

    // --- STATE LỊCH BẤM MÁY ---
    const [scheduleList, setScheduleList] = useState([]);
    const [loadingSch, setLoadingSch] = useState(true);
    const [isSchModalOpen, setIsSchModalOpen] = useState(false);
    const [schFormData, setSchFormData] = useState({ projectName: '', date: '', location: '', status: 'upcoming' });

    // 1. LẮNG NGHE DỮ LIỆU TỪ FIREBASE
    useEffect(() => {
        // Lắng nghe Thiết bị
        const qEq = query(collection(db, 'equipment'), orderBy('timestamp', 'desc'));
        const unsubEq = onSnapshot(qEq, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
            setEquipmentList(items);
            setLoadingEq(false);
        });

        // Lắng nghe Lịch quay
        const qSch = query(collection(db, 'schedules'), orderBy('date', 'asc'));
        const unsubSch = onSnapshot(qSch, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
            setScheduleList(items);
            setLoadingSch(false);
        });

        return () => { unsubEq(); unsubSch(); };
    }, []);

    // 2. XỬ LÝ KHO THIẾT BỊ
    const handleAddEquipment = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = "";

            if (eqImageFile) {
                const imageRef = ref(storage, `production_equipments/${Date.now()}_${eqImageFile.name}`);
                await uploadBytes(imageRef, eqImageFile);
                finalImageUrl = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, 'equipment'), {
                name: eqFormData.name,
                category: eqFormData.category,
                status: eqFormData.status,
                // 👇 Lưu link ảnh
                imageUrl: finalImageUrl
            });

            setIsAddEqModalOpen(false);
            setEqFormData(initialEqState);
            setEqImageFile(null);
            setEqImagePreview(null);
            alert("Thêm thiết bị thành công!");

        } catch (error) {
            console.error("Lỗi khi thêm:", error);
            alert("Đã xảy ra lỗi khi thêm thiết bị.");
        }
    };

    const handleUpdateEquipment = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = editEqFormData.imageUrl || ""; // Lấy link cũ nếu có

            // Nếu người dùng có chọn ảnh mới
            if (editEqImageFile) {
                // Tạo nơi chứa ảnh trên Firebase Storage với tên file random (chống trùng)
                const imageRef = ref(storage, `production_equipments/${Date.now()}_${editEqImageFile.name}`);

                // Đẩy file lên Storage
                await uploadBytes(imageRef, editEqImageFile);

                // Lấy đường dẫn URL của ảnh vừa đẩy lên
                finalImageUrl = await getDownloadURL(imageRef);
            }

            // Cập nhật vào Firestore
            await updateDoc(doc(db, 'equipment', editEqFormData.id), {
                name: editEqFormData.name,
                category: editEqFormData.category,
                status: editEqFormData.status,
                // 👇 Lưu thêm field imageUrl vào database
                imageUrl: finalImageUrl
            });

            setIsEditEqModalOpen(false);
            setEditEqImageFile(null); // Xóa file bộ nhớ tạm
            alert("Cập nhật thành công!");

        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            alert("Đã xảy ra lỗi khi cập nhật thiết bị.");
        }
    };

    const handleDeleteEquipment = async (id) => {
        if (window.confirm("Xóa thiết bị này khỏi kho?")) await deleteDoc(doc(db, 'equipment', id));
    };

    // 3. XỬ LÝ LỊCH BẤM MÁY
    const handleAddSchedule = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'schedules'), { ...schFormData, timestamp: new Date().getTime() });
            setIsSchModalOpen(false);
            setSchFormData({ projectName: '', date: '', location: '', status: 'upcoming' });
        } catch (error) { alert("Lỗi khi tạo lịch quay!"); }
    };

    const handleDeleteSchedule = async (id) => {
        if (window.confirm("Hủy lịch quay này?")) await deleteDoc(doc(db, 'schedules', id));
    };

    // 4. HÀM HIỂN THỊ MÀU SẮC
    const getEqStatusColor = (status) => {
        switch (status) {
            case 'available': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'in-use': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'maintenance': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getSchStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'in-progress': return 'text-vps-gold bg-vps-gold/10 border-vps-gold/20';
            case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const [eqImageFile, setEqImageFile] = useState(null);
    const [eqImagePreview, setEqImagePreview] = useState(null);

    // Hàm xử lý khi chọn ảnh
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEqImageFile(file);
            setEqImagePreview(URL.createObjectURL(file)); // Tạo link xem trước
        }
    };

    return (
        <div className="min-h-screen bg-vps-black flex">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 overflow-y-auto overflow-x-hidden">

                {/* Tiêu đề trang & Nút hành động */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-serif font-bold text-vps-gold">Vận hành Sản xuất</h1>
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </div>
                        <p className="text-vps-ivory opacity-60 mt-1">Quản lý trạng thái thiết bị và điều phối lịch quay On-set.</p>
                    </div>

                    {/* Nút Thêm thay đổi linh hoạt theo Tab */}
                    <button
                        onClick={() => activeTab === 'equipment' ? setIsEqModalOpen(true) : setIsSchModalOpen(true)}
                        className="bg-vps-gold hover:bg-vps-gold-hover text-vps-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {activeTab === 'equipment' ? 'Thêm thiết bị' : 'Tạo lịch quay'}
                    </button>
                </div>

                {/* Tabs chuyển đổi */}
                <div className="flex gap-4 border-b border-vps-gray mb-6">
                    <button
                        onClick={() => setActiveTab('equipment')}
                        className={`pb-3 px-2 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'equipment' ? 'text-vps-gold border-vps-gold' : 'text-vps-ivory opacity-50 border-transparent hover:opacity-100'}`}
                    >
                        <Camera className="w-4 h-4" /> Kho Thiết bị
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`pb-3 px-2 flex items-center gap-2 font-medium transition-colors border-b-2 ${activeTab === 'schedule' ? 'text-vps-gold border-vps-gold' : 'text-vps-ivory opacity-50 border-transparent hover:opacity-100'}`}
                    >
                        <CalendarDays className="w-4 h-4" /> Lịch Bấm máy
                    </button>
                </div>

                {/* --- NỘI DUNG TAB: KHO THIẾT BỊ --- */}
                {activeTab === 'equipment' && (
                    <>
                        {loadingEq ? (
                            <div className="text-center text-vps-gold animate-pulse mt-20">Đang tải dữ liệu kho...</div>
                        ) : equipmentList.length === 0 ? (
                            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-10 text-center shadow-lg">
                                <Wrench className="w-16 h-16 text-vps-gray mx-auto mb-4 opacity-50" />
                                <p className="text-vps-ivory opacity-60">Kho thiết bị đang trống. Hãy thêm camera hoặc thiết bị mới.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {equipmentList.map(item => (
                                    <div key={item.id} className="bg-[#1E1E1E] border border-vps-gray p-5 rounded-xl shadow-lg flex flex-col h-full hover:border-vps-gold/50 transition-colors">

                                        {/* Phần thông tin phía trên */}
                                        <div className="flex justify-between items-start mb-4">
                                            {/* Avatar Thiết bị: Ưu tiên hiển thị hình ảnh nếu có */}
                                            {item.imageUrl ? (
                                                <div className="w-12 h-12 rounded-lg border border-vps-gray overflow-hidden shrink-0 bg-[#111]">
                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 flex items-center justify-center bg-[#111] rounded-lg border border-vps-gray shrink-0">
                                                    {item.category === 'Camera' ? <Video className="w-6 h-6 text-vps-gold" /> : <Wrench className="w-6 h-6 text-vps-ivory opacity-50" />}
                                                </div>
                                            )}

                                            {/* Thông tin thiết bị */}
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getEqStatusColor(item.status)}`}>
                                                {item.status === 'available' ? 'Sẵn sàng' : item.status === 'in-use' ? 'Đi quay' : item.status === 'maintenance' ? 'Bảo trì' : 'Cho thuê'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-vps-ivory">{item.name}</h3>
                                        <p className="text-sm text-vps-ivory opacity-50">{item.category}</p>

                                        {/* 👇 CHÌA KHÓA Ở ĐÂY: mt-auto đẩy div này xuống đáy, justify-end ép sang phải */}
                                        <div className="mt-auto pt-4 flex justify-end gap-3 border-t border-vps-gray/30 mt-4">
                                            <button
                                                onClick={() => { setEditEqFormData(item); setIsEditEqModalOpen(true); }}
                                                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEquipment(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>


                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- NỘI DUNG TAB: LỊCH BẤM MÁY --- */}
                {activeTab === 'schedule' && (
                    <>
                        {loadingSch ? (
                            <div className="text-center text-vps-gold animate-pulse mt-20">Đang tải lịch trình...</div>
                        ) : scheduleList.length === 0 ? (
                            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-10 text-center shadow-lg">
                                <CalendarDays className="w-16 h-16 text-vps-gray mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-medium text-vps-ivory mb-2">Chưa có lịch quay nào</h3>
                                <p className="text-vps-ivory opacity-60">Hãy tạo lịch trình mới để bắt đầu dự án.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {scheduleList.map(item => (
                                    <div key={item.id} className="bg-[#1E1E1E] border-l-4 border-l-vps-gold border border-vps-gray p-6 rounded-r-xl shadow-lg relative group">
                                        {/* Nút Chỉnh sửa */}

                                        <div className="absolute top-4 right-12 z-10 flex gap-2">
                                            <button onClick={() => { setEditEqFormData(item); setIsEditEqModalOpen(true); }} className="absolute top-4 right-12 text-vps-gold/50 hover:text-vps-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button onClick={() => handleDeleteSchedule(item.id)} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-bold text-vps-ivory pr-8">{item.projectName}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider whitespace-nowrap ${getSchStatusColor(item.status)}`}>
                                                {item.status === 'upcoming' ? 'Sắp tới' : item.status === 'in-progress' ? 'Đang quay' : 'Hoàn thành'}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mt-4 text-sm text-vps-ivory opacity-80">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-vps-gold" />
                                                <span>{item.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-vps-gold" />
                                                <span>{item.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* MODAL THÊM LỊCH QUAY */}
                {isSchModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1E1E1E] border border-vps-gray p-6 rounded-xl w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-vps-gold mb-4">Tạo Lịch Quay Mới</h2>
                            <form onSubmit={handleAddSchedule} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Tên dự án / Cảnh quay</label>
                                    <input required type="text" className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={schFormData.projectName} onChange={e => setSchFormData({ ...schFormData, projectName: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory opacity-80 mb-1">Ngày giờ</label>
                                        <input required type="datetime-local" className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none [color-scheme:dark]" value={schFormData.date} onChange={e => setSchFormData({ ...schFormData, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory opacity-80 mb-1">Trạng thái</label>
                                        <select className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={schFormData.status} onChange={e => setSchFormData({ ...schFormData, status: e.target.value })}>
                                            <option value="upcoming">Sắp tới</option>
                                            <option value="in-progress">Đang quay</option>
                                            <option value="completed">Đã hoàn thành</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Địa điểm / Studio</label>
                                    <input required type="text" placeholder="VD: Studio 1, Quán Cafe X..." className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={schFormData.location} onChange={e => setSchFormData({ ...schFormData, location: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vps-gray/50">
                                    <button type="button" onClick={() => setIsSchModalOpen(false)} className="px-4 py-2 text-vps-ivory opacity-60 hover:opacity-100 transition">Hủy</button>
                                    <button type="submit" className="px-4 py-2 bg-vps-gold text-vps-black font-semibold rounded hover:bg-vps-gold-hover transition">Lưu lịch trình</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL THÊM THIẾT BỊ (Đã gộp từ code trước) */}
                {isEqModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1E1E1E] border border-vps-gray p-6 rounded-xl w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-vps-gold mb-4">Thêm Thiết Bị Mới</h2>
                            <form onSubmit={handleAddEquipment} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Tên thiết bị</label>
                                    <input required type="text" className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={eqFormData.name} onChange={e => setEqFormData({ ...eqFormData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory opacity-80 mb-1">Phân loại</label>
                                        <select className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={eqFormData.category} onChange={e => setEqFormData({ ...eqFormData, category: e.target.value })}>
                                            <option value="Camera">Máy quay (Camera)</option>
                                            <option value="Lens">Ống kính (Lens)</option>
                                            <option value="Lighting">Đèn (Lighting)</option>
                                            <option value="Audio">Âm thanh (Audio)</option>
                                            <option value="Gimbal">Gimbal / Tripod</option>
                                            <option value="Other">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory opacity-80 mb-1">Trạng thái</label>
                                        <select className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={eqFormData.status} onChange={e => setEqFormData({ ...eqFormData, status: e.target.value })}>
                                            <option value="available">Sẵn sàng</option>
                                            <option value="in-use">Đang đi quay</option>
                                            <option value="rental">Cho thuê</option>
                                            <option value="maintenance">Bảo trì</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vps-gray/50">
                                    <button type="button" onClick={() => setIsEqModalOpen(false)} className="px-4 py-2 text-vps-ivory opacity-60 hover:opacity-100 transition">Hủy</button>
                                    <button type="submit" className="px-4 py-2 bg-vps-gold text-vps-black font-semibold rounded hover:bg-vps-gold-hover transition">Lưu vào kho</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL CHỈNH SỬA THIẾT BỊ (Đã gộp từ code trước) */}
                {isEditEqModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1E1E1E] border border-vps-gray p-6 rounded-xl w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-vps-gold mb-4">Cập Nhật Trạng Thái</h2>
                            <form onSubmit={handleUpdateEquipment} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Tên thiết bị</label>
                                    <input required type="text" className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={editEqFormData.name} onChange={e => setEditEqFormData({ ...editEqFormData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-vps-ivory opacity-80 mb-1">Phân loại</label>
                                        <select className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:border-vps-gold focus:outline-none" value={editEqFormData.category} onChange={e => setEditEqFormData({ ...editEqFormData, category: e.target.value })}>
                                            <option value="Camera">Máy quay (Camera)</option>
                                            <option value="Lens">Ống kính (Lens)</option>
                                            <option value="Lighting">Đèn (Lighting)</option>
                                            <option value="Audio">Âm thanh (Audio)</option>
                                            <option value="Gimbal">Gimbal / Tripod</option>
                                            <option value="Other">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-vps-ivory opacity-80 mb-1 text-vps-gold">Trạng thái hiện tại</label>
                                        <select className="w-full bg-[#111111] border border-vps-gold rounded p-2 text-vps-gold focus:outline-none" value={editEqFormData.status} onChange={e => setEditEqFormData({ ...editEqFormData, status: e.target.value })}>
                                            <option value="available">Sẵn sàng (Kho)</option>
                                            <option value="in-use">Đang đi quay</option>
                                            <option value="rental">Cho thuê</option>
                                            <option value="maintenance">Đang bảo trì</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vps-gray/50">
                                    <button type="button" onClick={() => setIsEditEqModalOpen(false)} className="px-4 py-2 text-vps-ivory opacity-60 hover:opacity-100 transition">Hủy</button>
                                    <button type="submit" className="px-4 py-2 bg-vps-gold text-vps-black font-semibold rounded hover:bg-vps-gold-hover transition">Lưu thay đổi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Production;