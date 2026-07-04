import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { Folder, FileText, Link as LinkIcon, Video, Plus, Trash2, ExternalLink, Cloud } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Archive = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        type: 'link', // 'link', 'folder', 'script', 'video'
        url: ''
    });

    // 1. Lắng nghe dữ liệu Real-time
    useEffect(() => {
        const q = query(collection(db, 'archives'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            setResources(items);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. Thêm tài nguyên mới
    const handleAddResource = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'archives'), {
                ...formData,
                date: new Date().toLocaleDateString('vi-VN'),
                timestamp: new Date().getTime()
            });
            setIsModalOpen(false);
            setFormData({ name: '', type: 'link', url: '' }); // Reset form
        } catch (error) {
            console.error("Lỗi thêm tài nguyên: ", error);
            alert("Có lỗi xảy ra khi lưu trữ!");
        }
    };

    // 3. Xóa tài nguyên
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) {
            await deleteDoc(doc(db, 'archives', id));
        }
    };

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            console.log("Đã bắt được file:", files[0].name);
            alert(`Đã nhận file ${files[0].name}. (Chèn hàm Google Drive API vào đây)`);
            // Chỗ này gọi hàm up Drive của bạn nhé
        }
    };

    // Chọn icon dựa theo loại tài nguyên
    const getIcon = (type) => {
        switch (type) {
            case 'folder': return <Folder className="w-8 h-8 text-vps-gold" />;
            case 'script': return <FileText className="w-8 h-8 text-blue-400" />;
            case 'video': return <Video className="w-8 h-8 text-purple-400" />;
            default: return <LinkIcon className="w-8 h-8 text-green-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-vps-black flex">
            <Sidebar />
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 md:ml-64 p-4 pt-20 md:p-8 overflow-y-auto transition-all ${isDragging ? 'bg-vps-gold/5 border-2 border-dashed border-vps-gold' : ''}`}
            >

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4"></div><div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-serif font-bold text-vps-gold">Lưu trữ Tài nguyên</h1>
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </div>
                        <p className="text-vps-ivory opacity-60 mt-1">Quản lý kịch bản, source quay và liên kết đám mây của các dự án.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-vps-gold hover:bg-vps-gold-hover text-vps-black font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Thêm tài nguyên
                    </button>
                </div>

                {/* Khung Hiển thị Dữ liệu */}
                {loading ? (
                    <div className="text-center text-vps-gold animate-pulse mt-20">Đang tải thư viện đám mây...</div>
                ) : resources.length === 0 ? (
                    <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl p-10 text-center shadow-lg">
                        <Folder className="w-16 h-16 text-vps-gray mx-auto mb-4 opacity-50" />
                        <p className="text-vps-ivory opacity-60">Kho lưu trữ đang trống. Hãy thêm các đường link dự án của bạn.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {resources.map((item) => (
                            <div key={item.id} className="bg-[#1E1E1E] border border-vps-gray p-6 rounded-xl shadow-lg hover:border-vps-gold/50 transition-colors group relative flex flex-col h-full">

                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa tài nguyên"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="mb-4 bg-[#111] p-3 w-fit rounded-lg border border-vps-gray">
                                    {getIcon(item.type)}
                                </div>

                                <h3 className="text-lg font-semibold text-vps-ivory mb-1 line-clamp-2">{item.name}</h3>
                                <p className="text-xs text-vps-ivory opacity-40 mb-4">Thêm ngày: {item.date}</p>

                                <div className="mt-auto pt-4 border-t border-vps-gray/50">
                                    <a
                                        href={item.url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-vps-gold hover:text-vps-gold-hover flex items-center gap-1 w-fit"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {item.url ? 'Mở liên kết' : 'Không có liên kết'}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* MODAL THÊM TÀI NGUYÊN */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1E1E1E] border border-vps-gray p-6 rounded-xl w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-vps-gold mb-4">Thêm Liên Kết / Tài Liệu</h2>
                            <form onSubmit={handleAddResource} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Tên tài nguyên / Dự án</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="VD: Source quay Seagate tháng 6..."
                                        className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:outline-none focus:border-vps-gold"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Định dạng lưu trữ</label>
                                    <select
                                        className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:outline-none focus:border-vps-gold"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="link">Google Drive / Link chia sẻ</option>
                                        <option value="video">Blackmagic Cloud / Source Video</option>
                                        <option value="script">Kịch bản / Document</option>
                                        <option value="folder">Thư mục dự án</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-vps-ivory opacity-80 mb-1">Đường dẫn (URL)</label>
                                    <input
                                        required
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        className="w-full bg-[#111111] border border-vps-gray rounded p-2 text-vps-ivory focus:outline-none focus:border-vps-gold"
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-vps-ivory opacity-60 hover:opacity-100 transition">
                                        Hủy
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-vps-gold text-vps-black font-semibold rounded hover:bg-vps-gold-hover transition">
                                        Lưu tài nguyên
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

export default Archive;