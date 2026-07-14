import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import { useAuth } from '../../contexts/AuthContext';
import {
    Camera, CalendarDays, Wrench, Video, Plus,
    Trash2, Cloud, Pencil, MapPin, Clock, Image as ImageIcon,
    Search, Filter, CheckCircle, AlertTriangle, PlayCircle, X,
    FileText, Sun, Users, BellRing, Lock
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// DANH SÁCH VỊ TRÍ PHÂN CẤP TỪ TRÊN XUỐNG DƯỚI (DÀNH CHO FILM)
const PRODUCTION_POSITIONS = [
    'Đạo diễn (Director)',
    'Phó Đạo diễn (1st AD)',
    'Đạo diễn Hình ảnh (DOP)',
    'Quay phim (Camera Operator)',
    'Trợ lý Quay phim (1st AC / Focus Puller)',
    'Gaffer (Trưởng Ánh sáng)',
    'Thiết kế Mỹ thuật (Production Designer)',
    'Thu âm Hiện trường (Sound Recordist)',
    'Trang điểm / Làm tóc (MUA/Hair)',
    'Phục trang (Wardrobe)',
    'Thư ký Trường quay (Script Supervisor)',
    'Chủ nhiệm (Line Producer)',
    'Trợ lý Hiện trường (Set PA)',
    'Hậu cần (Catering)',
    'Diễn viên (Talent/Cast)'
];

// DANH SÁCH VỊ TRÍ DÀNH CHO SỰ KIỆN
const EVENT_POSITIONS = [
    'Điều phối',
    'Cam chính',
    'Cam gimbal',
    'Chụp chính',
    'Chụp phụ',
    'Trợ lý',
    'Behind the scenes',
];

const Production = () => {
    const { currentUser, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('callsheet');

    // --- XÁC ĐỊNH QUYỀN FREELANCER / CTV ---
    const isManager = ['founder', 'front_office'].includes(userRole);
    const isFreelancer = ['freelancer', 'ctv'].includes(userRole);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterOption, setFilterOption] = useState('All');

    // --- DANH SÁCH NHÂN SỰ TỪ FIREBASE ---
    const [employeeList, setEmployeeList] = useState([]);
    const currentEmpName = employeeList.find(e => e.id === currentUser?.uid)?.name || currentUser?.displayName || '';

    // --- KHO THIẾT BỊ ---
    const [equipmentList, setEquipmentList] = useState([]);
    const [loadingEq, setLoadingEq] = useState(true);
    const [isEqModalOpen, setIsEqModalOpen] = useState(false);
    const initialEqState = { name: '', category: 'Camera', status: 'available' };
    const [eqFormData, setEqFormData] = useState(initialEqState);
    const [isEditEqModalOpen, setIsEditEqModalOpen] = useState(false);
    const [editEqFormData, setEditEqFormData] = useState({ id: '', name: '', category: '', status: '' });
    const [eqImageFile, setEqImageFile] = useState(null);
    const [eqImagePreview, setEqImagePreview] = useState(null);
    const [editEqImageFile, setEditEqImageFile] = useState(null);
    const [editEqImagePreview, setEditEqImagePreview] = useState(null);

    // --- LỊCH BẤM MÁY ---
    const [scheduleList, setScheduleList] = useState([]);
    const [loadingSch, setLoadingSch] = useState(true);
    const [isSchModalOpen, setIsSchModalOpen] = useState(false);

    const initialSchState = {
        scheduleType: 'film',
        projectName: '', date: '', location: '', status: 'upcoming',
        crew: [], equipments: []
    };
    const [schFormData, setSchFormData] = useState(initialSchState);

    const [newCrewName, setNewCrewName] = useState('');
    const [newCrewPos, setNewCrewPos] = useState('');
    const [newEqName, setNewEqName] = useState('');

    // --- LỆNH GỌI QUAY (CALL SHEET) ---
    const [callSheetList, setCallSheetList] = useState([]);
    const [loadingCs, setLoadingCs] = useState(true);
    const [isCsModalOpen, setIsCsModalOpen] = useState(false);

    const defaultCsContent = `
        <p><strong style="color: #ff4d4f;">** NO SOCIAL MEDIA - CLOSED SET **</strong></p>
        <p><strong>Questions?</strong> Call Jack Doe (xxx) xxx-xxxx | <strong>Walkie Assignments:</strong> (5)</p><br/>
        
        <h3>🎬 SCENES - SET AND DESCRIPTION</h3>
        <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
            <tr style="background-color: #222;"><th>SCENES</th><th>SET AND DESCRIPTION</th><th>CHARACTER</th><th>D/N</th><th>PAGES</th><th>LOCATION/NOTES</th></tr>
            <tr><td>1</td><td>[Nhập Tên bối cảnh]</td><td></td><td>Day</td><td>1/8</td><td></td></tr>
        </table><br/>

        <h3>🎭 CAST & CHARACTERS</h3>
        <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
            <tr style="background-color: #222;"><th>CAST</th><th>CHARACTERS</th><th>W/H/M/U</th><th>SET</th><th>MINOR?</th><th>SPECIAL INSTRUCTIONS</th></tr>
            <tr><td>[Tên DV]</td><td>[Vai diễn]</td><td>07:00</td><td>08:00</td><td>N</td><td></td></tr>
        </table><br/>
    `;

    const initialCsState = {
        title: '', shootDate: '', dayXofY: 'Day 1 of 1', callTime: '09:00 AM',
        producer: '', director: '', upm: '', breakfast: '08:00 AM', lunch: '01:00 PM',
        sunrise: '06:15 AM', sunset: '05:50 PM', weather: '70° AM | 80° NOON',
        hospital: '', address: '', content: defaultCsContent
    };
    const [csFormData, setCsFormData] = useState(initialCsState);
    const [editingCsId, setEditingCsId] = useState(null);

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['table', 'clean']
        ],
    };

    useEffect(() => {
        setSearchTerm(''); setFilterOption('All');
    }, [activeTab]);

    useEffect(() => {
        const unsubEmp = onSnapshot(collection(db, 'employees'), (snapshot) => {
            setEmployeeList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubEq = onSnapshot(query(collection(db, 'equipment'), orderBy('timestamp', 'desc')), (snapshot) => {
            setEquipmentList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingEq(false);
        });

        const unsubSch = onSnapshot(query(collection(db, 'schedules'), orderBy('date', 'asc')), (snapshot) => {
            setScheduleList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingSch(false);
        });

        const unsubCs = onSnapshot(query(collection(db, 'callsheets'), orderBy('timestamp', 'desc')), (snapshot) => {
            setCallSheetList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoadingCs(false);
        });

        return () => { unsubEmp(); unsubEq(); unsubSch(); unsubCs(); };
    }, []);

    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0];
        if (file) {
            if (isEdit) { setEditEqImageFile(file); setEditEqImagePreview(URL.createObjectURL(file)); }
            else { setEqImageFile(file); setEqImagePreview(URL.createObjectURL(file)); }
        }
    };

    // --- HANDLERS: THIẾT BỊ --- 
    const handleAddEquipment = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = "";
            if (eqImageFile) {
                const imageRef = ref(storage, `production_equipments/${Date.now()}_${eqImageFile.name}`);
                await uploadBytes(imageRef, eqImageFile);
                finalImageUrl = await getDownloadURL(imageRef);
            }
            await addDoc(collection(db, 'equipment'), { ...eqFormData, imageUrl: finalImageUrl, timestamp: new Date().getTime() });
            setIsEqModalOpen(false); setEqFormData(initialEqState); setEqImageFile(null); setEqImagePreview(null);
        } catch (error) { alert("Đã xảy ra lỗi khi thêm thiết bị."); }
    };
    const handleUpdateEquipment = async (e) => {
        e.preventDefault();
        try {
            let finalImageUrl = editEqFormData.imageUrl || "";
            if (editEqImageFile) {
                const imageRef = ref(storage, `production_equipments/${Date.now()}_${editEqImageFile.name}`);
                await uploadBytes(imageRef, editEqImageFile);
                finalImageUrl = await getDownloadURL(imageRef);
            }
            await updateDoc(doc(db, 'equipment', editEqFormData.id), { name: editEqFormData.name, category: editEqFormData.category, status: editEqFormData.status, imageUrl: finalImageUrl });
            setIsEditEqModalOpen(false); setEditEqImageFile(null); setEditEqImagePreview(null);
        } catch (error) { alert("Đã xảy ra lỗi khi cập nhật thiết bị."); }
    };
    const handleDeleteEquipment = async (id) => { if (window.confirm("Xóa thiết bị này khỏi kho?")) await deleteDoc(doc(db, 'equipment', id)); };

    // --- HANDLERS: LỊCH QUAY ---
    const addCrewToForm = () => {
        if (!newCrewName || !newCrewPos) return;
        if (schFormData.crew.some(c => c.name === newCrewName && c.position === newCrewPos)) return;
        setSchFormData(prev => ({ ...prev, crew: [...(prev.crew || []), { name: newCrewName, position: newCrewPos, confirmed: false }] }));
        setNewCrewName(''); setNewCrewPos('');
    };
    const removeCrewFromForm = (index) => {
        setSchFormData(prev => ({ ...prev, crew: prev.crew.filter((_, i) => i !== index) }));
    };
    const addEqToForm = () => {
        if (!newEqName) return;
        if (schFormData.equipments.includes(newEqName)) return;
        setSchFormData(prev => ({ ...prev, equipments: [...(prev.equipments || []), newEqName] }));
        setNewEqName('');
    };
    const removeEqFromForm = (index) => {
        setSchFormData(prev => ({ ...prev, equipments: prev.equipments.filter((_, i) => i !== index) }));
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        try {
            if (editEqFormData.id && isSchModalOpen) {
                await updateDoc(doc(db, 'schedules', editEqFormData.id), { ...schFormData });
            } else {
                await addDoc(collection(db, 'schedules'), { ...schFormData, timestamp: new Date().getTime() });
            }
            setIsSchModalOpen(false); setSchFormData(initialSchState); setEditEqFormData({ id: '' });
        } catch (error) { alert("Lỗi xử lý lịch quay!"); }
    };

    const openEditSchedule = (item) => {
        setSchFormData({
            scheduleType: item.scheduleType || 'film',
            projectName: item.projectName, date: item.date, location: item.location,
            status: item.status, crew: item.crew || [], equipments: item.equipments || []
        });
        setEditEqFormData({ id: item.id }); setIsSchModalOpen(true);
    };
    const handleDeleteSchedule = async (id) => { if (window.confirm("Hủy lịch quay này?")) await deleteDoc(doc(db, 'schedules', id)); };

    const handleConfirmAttendance = async (scheduleId, currentSchedule) => {
        try {
            const updatedCrew = currentSchedule.crew.map(member => {
                if (member.name.toLowerCase() === currentEmpName.toLowerCase()) {
                    return { ...member, confirmed: true };
                }
                return member;
            });
            await updateDoc(doc(db, 'schedules', scheduleId), { crew: updatedCrew });
        } catch (error) {
            console.error("Lỗi khi xác nhận lịch quay:", error);
            alert("Lỗi khi xác nhận, vui lòng thử lại!");
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} | ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    // --- HANDLERS: CALL SHEET --- 
    const handleSaveCallSheet = async (e) => {
        e.preventDefault();
        try {
            if (editingCsId) await updateDoc(doc(db, 'callsheets', editingCsId), { ...csFormData });
            else await addDoc(collection(db, 'callsheets'), { ...csFormData, timestamp: new Date().getTime() });
            setIsCsModalOpen(false); setCsFormData(initialCsState); setEditingCsId(null);
        } catch (error) { alert("Lỗi lưu Call Sheet!"); }
    };
    const openEditCallSheet = (item) => { setCsFormData({ ...item }); setEditingCsId(item.id); setIsCsModalOpen(true); };
    const handleDeleteCallSheet = async (id) => { if (window.confirm("Xóa Lệnh Gọi Quay này?")) await deleteDoc(doc(db, 'callsheets', id)); };

    // --- HELPERS ---
    const getEqStatusColor = (status) => {
        switch (status) {
            case 'available': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'in-use': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'maintenance': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'rental': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };
    const getSchStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'in-progress': return 'text-vps-gold bg-vps-gold/10 border-vps-gold/20';
            case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const renderAnalytics = () => {
        if (activeTab === 'equipment') {
            if (isFreelancer) return null; // Ẩn thống kê thiết bị với CTV

            const available = equipmentList.filter(e => e.status === 'available').length;
            const inUse = equipmentList.filter(e => e.status === 'in-use').length;
            const maintenance = equipmentList.filter(e => e.status === 'maintenance').length;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-vps-gold/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-vps-gold/5 rounded-full blur-2xl group-hover:bg-vps-gold/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Thiết bị</p><h3 className="text-3xl font-bold text-vps-gold">{equipmentList.length}</h3></div>
                            <div className="p-3 bg-vps-gold/10 rounded-xl border border-vps-gold/20"><Camera className="w-6 h-6 text-vps-gold" /></div>
                        </div>
                    </div>
                </div>
            );
        } else if (activeTab === 'schedule') {
            const upcoming = filteredSchedule.filter(s => s.status === 'upcoming').length;
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Lịch Sắp tới của bạn</p><h3 className="text-3xl font-bold text-blue-400">{upcoming}</h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><CalendarDays className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Lệnh Gọi Quay</p><h3 className="text-3xl font-bold text-blue-400">{callSheetList.length}</h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><FileText className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                </div>
            )
        }
    };

    const filteredEquipment = equipmentList.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterOption === 'All' || item.status === filterOption;
        return matchSearch && matchFilter;
    });

    const filteredSchedule = scheduleList.filter(item => {
        const matchSearch = item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || item.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterOption === 'All' || item.status === filterOption;

        const isAssigned = item.crew?.some(c => c.name.toLowerCase() === currentEmpName.toLowerCase());
        const hasAccess = isManager || isAssigned;

        return matchSearch && matchFilter && hasAccess;
    });

    const filteredCallSheets = callSheetList.filter(item => {
        return item.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <AppShell title="Production" subtitle="Quản lý crew, schedule và call sheet">
            <div className="overflow-y-auto w-full">

                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold drop-shadow-md">Vận hành Sản xuất</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]"><Cloud className="w-3.5 h-3.5" /><span className="text-[10px] font-bold uppercase tracking-wider">Đã đồng bộ</span></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Quản lý kho thiết bị và điều phối lịch quay dự án On-set.</p>
                    </div>

                    {/* ẨN NÚT THÊM NẾU LÀ FREELANCER VÀ ĐANG Ở TAB EQUIPMENT */}
                    {userRole !== 'back_office' && !isFreelancer && (
                        <button
                            onClick={() => {
                                if (activeTab === 'equipment') { setEqFormData(initialEqState); setEqImagePreview(null); setEqImageFile(null); setIsEqModalOpen(true); }
                                else if (activeTab === 'schedule') { setSchFormData(initialSchState); setEditEqFormData({ id: '' }); setIsSchModalOpen(true); }
                                else { setCsFormData(initialCsState); setEditingCsId(null); setIsCsModalOpen(true); }
                            }}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{activeTab === 'equipment' ? 'Thêm Thiết Bị' : activeTab === 'schedule' ? 'Tạo Lịch Quay' : 'Tạo Call Sheet'}</span>
                        </button>
                    )}
                </div>

                <div className="flex overflow-x-auto gap-3 mb-10 custom-scrollbar pb-2">
                    <button onClick={() => setActiveTab('equipment')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'equipment' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}><Camera className="w-5 h-5" /> Kho Thiết bị</button>
                    <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'schedule' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}><CalendarDays className="w-5 h-5" /> Lịch Bấm máy</button>
                    <button onClick={() => setActiveTab('callsheet')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'callsheet' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}><FileText className="w-5 h-5" /> Call Sheet</button>
                </div>

                {renderAnalytics()}

                {/* ẨN THANH TÌM KIẾM NẾU LÀ FREELANCER VÀ ĐANG Ở TAB EQUIPMENT */}
                {!(isFreelancer && activeTab === 'equipment') && (
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors" />
                        </div>
                    </div>
                )}


                {/* --- TAB: KHO THIẾT BỊ --- */}
                {activeTab === 'equipment' && (
                    isFreelancer ? (
                        <div className="bg-[#1A1A1A] border border-red-500/20 rounded-2xl p-16 text-center shadow-xl mt-8">
                            <Lock className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-400 mb-2">Khu vực hạn chế</h3>
                            <p className="text-gray-400 font-medium">Tài khoản Cộng tác viên / Freelancer không có quyền truy cập thông tin Kho thiết bị.</p>
                        </div>
                    ) : (
                        <>
                            {loadingEq ? <div className="text-center text-vps-gold animate-pulse py-20 font-semibold">Đang tải dữ liệu kho...</div>
                                : filteredEquipment.length === 0 ? <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-16 text-center shadow-xl"><Wrench className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 font-medium">Kho trống hoặc không tìm thấy kết quả.</p></div>
                                    : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {filteredEquipment.map(item => (
                                                <div key={item.id} className="bg-[#1A1A1A] border border-vps-gray/20 p-5 rounded-2xl shadow-lg flex flex-col h-full hover:-translate-y-1 hover:border-vps-gold/50 transition-all group overflow-hidden relative">
                                                    <div className="flex justify-between items-start mb-5 relative z-10">
                                                        {item.imageUrl ? (
                                                            <div className="w-16 h-16 rounded-xl border border-vps-gray/30 overflow-hidden shrink-0 bg-[#111] shadow-inner">
                                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-[#222] to-[#111] rounded-xl border border-vps-gray/30 shrink-0 shadow-inner">
                                                                {item.category === 'Camera' ? <Video className="w-7 h-7 text-vps-gold/70" /> : <Wrench className="w-7 h-7 text-gray-500" />}
                                                            </div>
                                                        )}
                                                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${getEqStatusColor(item.status)}`}>
                                                            {item.status === 'available' ? 'Sẵn sàng' : item.status === 'in-use' ? 'Đi quay' : item.status === 'maintenance' ? 'Bảo trì' : 'Cho thuê'}
                                                        </span>
                                                    </div>
                                                    <div className="relative z-10"><h3 className="text-lg font-bold text-vps-ivory group-hover:text-vps-gold transition-colors line-clamp-1" title={item.name}>{item.name}</h3><p className="text-sm font-medium text-gray-500 mt-1">{item.category}</p></div>
                                                    {userRole !== 'back_office' && !isFreelancer && (
                                                        <div className="mt-auto pt-5 flex justify-end gap-3 border-t border-vps-gray/10 mt-5 relative z-10">
                                                            <button onClick={() => { setEditEqFormData(item); setEditEqImagePreview(item.imageUrl || null); setIsEditEqModalOpen(true); }} className="p-2.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                                                            {['founder', 'front_office'].includes(userRole) && (<button onClick={() => handleDeleteEquipment(item.id)} className="p-2.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                        </>
                    )
                )}


                {/* --- TAB: LỊCH BẤM MÁY --- */}
                {activeTab === 'schedule' && (
                    <>
                        {loadingSch ? <div className="text-center text-vps-gold animate-pulse py-20 font-semibold">Đang tải lịch trình...</div>
                            : filteredSchedule.length === 0 ? (
                                <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-16 text-center shadow-xl">
                                    <CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">Bạn chưa được phân công vào Lịch bấm máy nào.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {filteredSchedule.map(item => {
                                        const currentUserCrewInfo = item.crew?.find(c => c.name.toLowerCase() === currentEmpName.toLowerCase());
                                        const needsConfirmation = currentUserCrewInfo && !currentUserCrewInfo.confirmed && item.status !== 'completed';

                                        return (
                                            <div key={item.id} className="bg-[#1A1A1A] border-l-4 border-l-vps-gold border border-vps-gray/20 rounded-r-2xl rounded-l-sm shadow-xl relative group transition-all flex flex-col h-full overflow-hidden hover:border-vps-gold/30">

                                                <div className="p-5 md:p-6 flex-1 flex flex-col">

                                                    {needsConfirmation && (
                                                        <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg mb-5 flex items-center justify-between animate-pulse">
                                                            <div className="flex items-center gap-2">
                                                                <BellRing className="w-4 h-4 text-blue-400" />
                                                                <span className="text-blue-400 text-xs md:text-sm font-medium">Bạn có lịch quay mới, vui lòng xác nhận!</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleConfirmAttendance(item.id, item)}
                                                                className="bg-blue-500 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-blue-400 transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                                            >
                                                                Xác nhận
                                                            </button>
                                                        </div>
                                                    )}

                                                    {isManager && (
                                                        <div className="absolute top-5 right-5 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                            <button onClick={() => openEditSchedule(item)} className="p-2 bg-vps-gold/10 text-vps-gold hover:bg-vps-gold/20 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteSchedule(item.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    )}

                                                    <div className="mb-5 pr-20">
                                                        <div className="flex gap-2 mb-3">
                                                            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${getSchStatusColor(item.status)}`}>
                                                                {item.status === 'upcoming' ? 'Sắp tới' : item.status === 'in-progress' ? 'Đang diễn ra' : 'Hoàn thành'}
                                                            </span>
                                                            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${item.scheduleType === 'event' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-vps-gold bg-vps-gold/10 border-vps-gold/20'}`}>
                                                                {item.scheduleType === 'event' ? '🎪 Sự kiện' : '🎬 Phim'}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xl md:text-2xl font-bold text-vps-ivory line-clamp-2">{item.projectName}</h3>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                                        <div className="flex-1 bg-[#222] p-3 md:p-3.5 rounded-xl border border-vps-gray/10 flex items-center gap-3">
                                                            <div className="p-2 bg-vps-gold/10 rounded-lg"><Clock className="w-4 h-4 md:w-5 md:h-5 text-vps-gold" /></div>
                                                            <div>
                                                                <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Thời gian (Giờ | Ngày)</p>
                                                                <p className="text-xs md:text-sm font-bold text-gray-200">{formatDateTime(item.date)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 bg-[#222] p-3 md:p-3.5 rounded-xl border border-vps-gray/10 flex items-center gap-3">
                                                            <div className="p-2 bg-blue-500/10 rounded-lg"><MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /></div>
                                                            <div>
                                                                <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">Set Quay / Studio</p>
                                                                <p className="text-xs md:text-sm font-bold text-gray-200 line-clamp-1">{item.location}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-auto">
                                                        <div>
                                                            <h4 className="text-[11px] md:text-xs font-bold text-vps-gold mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5 md:w-4 md:h-4" /> PHÂN BỔ NHÂN SỰ</h4>
                                                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                                                {item.crew && item.crew.length > 0 ? item.crew.map((c, i) => (
                                                                    <div key={i} className="flex justify-between items-center text-[11px] md:text-sm bg-[#111] border border-vps-gray/10 p-2 md:p-2.5 rounded-lg">
                                                                        <span className={`font-medium truncate pr-2 flex items-center gap-1.5 ${c.confirmed ? 'text-green-400' : 'text-gray-300'}`}>
                                                                            {c.name} {c.confirmed && <CheckCircle className="w-3 h-3 text-green-500" title="Đã xác nhận" />}
                                                                        </span>
                                                                        <span className="text-[9px] md:text-[10px] bg-[#222] text-gray-400 px-1.5 md:px-2 py-1 rounded truncate shrink-0 max-w-[90px] md:max-w-[100px]" title={c.position}>{c.position}</span>
                                                                    </div>
                                                                )) : <p className="text-xs text-gray-500 italic">Chưa phân công nhân sự.</p>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[11px] md:text-xs font-bold text-blue-400 mb-3 flex items-center gap-2"><Video className="w-3.5 h-3.5 md:w-4 md:h-4" /> THIẾT BỊ SỬ DỤNG</h4>
                                                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                                                {item.equipments && item.equipments.length > 0 ? item.equipments.map((eq, i) => (
                                                                    <div key={i} className="flex justify-between items-center text-[11px] md:text-sm bg-[#111] border border-vps-gray/10 p-2 md:p-2.5 rounded-lg">
                                                                        <span className="text-gray-300 truncate">{eq}</span>
                                                                        <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500 shrink-0" />
                                                                    </div>
                                                                )) : <p className="text-xs text-gray-500 italic">Chưa xếp thiết bị.</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                    </>
                )}


                {/* --- TAB: CALL SHEET --- */}
                {activeTab === 'callsheet' && (
                    <>
                        {loadingCs ? <div className="text-center text-vps-gold animate-pulse py-20 font-semibold">Đang tải Call Sheets...</div>
                            : filteredCallSheets.length === 0 ? <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-16 text-center shadow-xl"><FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 font-medium">Chưa có Lệnh Gọi Quay nào.</p></div>
                                : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredCallSheets.map(item => (
                                            <div key={item.id} className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden hover:border-vps-gold/30 hover:-translate-y-1 transition-all group">
                                                <div className="bg-[#222] p-5 border-b border-vps-gray/10 relative">
                                                    {userRole !== 'back_office' && !isFreelancer && (
                                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openEditCallSheet(item)} className="p-2 bg-vps-gold/10 text-vps-gold hover:bg-vps-gold/20 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                                            {['founder', 'front_office'].includes(userRole) && (<button onClick={() => handleDeleteCallSheet(item.id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>)}
                                                        </div>
                                                    )}
                                                    <h3 className="text-lg font-bold text-vps-gold pr-16 line-clamp-2">{item.title}</h3>
                                                    <p className="text-xs text-gray-400 mt-1">{item.dayXofY}</p>
                                                </div>
                                                <div className="p-5 space-y-3 text-sm">
                                                    <div className="flex items-center justify-between text-gray-300 font-medium">
                                                        <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-400" /> {item.shootDate}</span>
                                                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400" /> {item.callTime}</span>
                                                    </div>
                                                    <div className="bg-[#111] p-3 rounded-xl border border-vps-gray/10 space-y-2">
                                                        <div className="flex items-center gap-2 text-gray-400 text-xs"><Users className="w-3.5 h-3.5" /> Dir: <strong className="text-vps-ivory">{item.director || '--'}</strong></div>
                                                        <div className="flex items-center gap-2 text-gray-400 text-xs"><MapPin className="w-3.5 h-3.5" /> Addr: <strong className="text-vps-ivory truncate">{item.address || '--'}</strong></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </>
                )}


                {/* --- CÁC MODAL --- */}
                {isSchModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                            <div className="p-4 md:p-5 border-b border-vps-gray/20 flex justify-between items-center shrink-0 bg-[#222]">
                                <h2 className="text-lg md:text-xl font-bold text-vps-gold">{editEqFormData.id ? 'Cập Nhật Lịch Quay' : 'Tạo Lịch Quay Mới'}</h2>
                                <button onClick={() => setIsSchModalOpen(false)} className="text-gray-500 hover:text-white bg-[#111] p-2 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                                <form id="scheduleForm" onSubmit={handleAddSchedule} className="space-y-6 md:space-y-8">

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-vps-gray/20 pb-2 mb-4">
                                            <h3 className="text-sm font-bold text-vps-ivory">1. Thông tin cảnh quay / Sự kiện</h3>

                                            {/* NÚT CHUYỂN ĐỔI PHIM ĐIỆN ẢNH VÀ SỰ KIỆN */}
                                            <div className="flex bg-[#222] p-1 rounded-lg border border-vps-gray/20">
                                                <button
                                                    type="button"
                                                    onClick={() => setSchFormData({ ...schFormData, scheduleType: 'film', crew: [] })}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${schFormData.scheduleType === 'film' ? 'bg-vps-gold text-black' : 'text-gray-400 hover:text-vps-ivory'}`}
                                                >
                                                    🎬 Phim
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSchFormData({ ...schFormData, scheduleType: 'event', crew: [] })}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${schFormData.scheduleType === 'event' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-vps-ivory'}`}
                                                >
                                                    🎪 Sự kiện
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">
                                                {schFormData.scheduleType === 'film' ? 'Tên dự án / Cảnh quay *' : 'Tên Sự kiện *'}
                                            </label>
                                            <input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3 text-sm text-vps-ivory focus:border-vps-gold outline-none" value={schFormData.projectName} onChange={e => setSchFormData({ ...schFormData, projectName: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Ngày & Giờ bấm máy *</label><input required type="datetime-local" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3 text-sm text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark]" value={schFormData.date} onChange={e => setSchFormData({ ...schFormData, date: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Địa điểm / Studio *</label><input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3 text-sm text-vps-ivory focus:border-vps-gold outline-none" value={schFormData.location} onChange={e => setSchFormData({ ...schFormData, location: e.target.value })} /></div>
                                        </div>
                                        <div><label className="block text-xs font-bold text-gray-400 mb-1">Trạng thái</label><select className="w-full md:w-1/2 bg-[#111] border border-vps-gray/20 rounded-xl p-3 text-sm text-vps-ivory focus:border-vps-gold outline-none" value={schFormData.status} onChange={e => setSchFormData({ ...schFormData, status: e.target.value })}><option value="upcoming">Sắp tới</option><option value="in-progress">Đang diễn ra</option><option value="completed">Đã hoàn thành</option></select></div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">

                                        {/* CREW */}
                                        <div className="bg-[#111] border border-vps-gray/10 p-4 md:p-5 rounded-xl flex flex-col h-full min-h-[350px]">
                                            <h3 className="text-sm font-bold text-vps-gold mb-4 flex items-center gap-2 shrink-0">
                                                <Users className="w-4 h-4" /> 2. Phân bổ Nhân sự
                                            </h3>

                                            <div className="flex flex-col gap-3 mb-5 shrink-0 bg-[#1A1A1A] p-3.5 rounded-xl border border-vps-gray/20">
                                                <select className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none cursor-pointer" value={newCrewName} onChange={e => setNewCrewName(e.target.value)}>
                                                    <option value="">-- 1. Chọn Nhân sự --</option>
                                                    {employeeList.map(emp => (<option key={emp.id} value={emp.name}>{emp.name}</option>))}
                                                </select>

                                                <div className="flex gap-2">
                                                    <select className="flex-1 bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-vps-gold outline-none cursor-pointer" value={newCrewPos} onChange={e => setNewCrewPos(e.target.value)}>
                                                        <option value="">-- 2. Chọn Vị trí --</option>
                                                        {(schFormData.scheduleType === 'event' ? EVENT_POSITIONS : PRODUCTION_POSITIONS).map(pos => (
                                                            <option key={pos} value={pos}>{pos}</option>
                                                        ))}
                                                    </select>
                                                    <button type="button" onClick={addCrewToForm} disabled={!newCrewName || !newCrewPos} className="bg-vps-gold/20 hover:bg-vps-gold hover:text-black text-vps-gold disabled:opacity-30 disabled:hover:bg-vps-gold/20 disabled:hover:text-vps-gold px-4 rounded-lg transition-colors shrink-0 flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 border-t border-vps-gray/10 pt-4">
                                                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Danh sách đã thêm ({schFormData.crew.length})</h4>

                                                {schFormData.crew.map((c, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-vps-gray/20 hover:border-vps-gold/30 transition-colors group">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-sm font-bold text-gray-200">{c.name}</span>
                                                            <span className="text-[11px] text-gray-400 bg-[#111] px-2 py-0.5 rounded-md w-fit border border-vps-gray/10">{c.position}</span>
                                                        </div>
                                                        <button type="button" onClick={() => removeCrewFromForm(index)} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="Xóa nhân sự"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                {schFormData.crew.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50 mt-4">
                                                        <Users className="w-8 h-8 text-gray-500 mb-2" />
                                                        <p className="text-xs text-gray-400">Chưa có nhân sự nào được thêm.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* HIỂN THỊ THỐNG KÊ MÁY QUAY/CHỤP NẾU LÀ SỰ KIỆN */}
                                            {schFormData.scheduleType === 'event' && schFormData.crew.length > 0 && (
                                                <div className="mt-4 flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0">
                                                    <div className="flex-1 flex items-center justify-between px-3 py-2 bg-[#111] rounded-lg border border-vps-gray/10">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">🎥 Máy Quay</span>
                                                        <span className="text-lg font-bold text-blue-400">{schFormData.crew.filter(c => c.position === 'Cam chính' || c.position === 'Cam gimbal').length}</span>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-between px-3 py-2 bg-[#111] rounded-lg border border-vps-gray/10">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">📸 Máy Chụp</span>
                                                        <span className="text-lg font-bold text-green-400">{schFormData.crew.filter(c => c.position === 'Chụp chính' || c.position === 'Chụp phụ').length}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* EQUIPMENT */}
                                        <div className="bg-[#111] border border-vps-gray/10 p-4 md:p-5 rounded-xl flex flex-col h-full min-h-[350px]">
                                            <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2 shrink-0"><Video className="w-4 h-4" /> 3. Danh sách Thiết bị</h3>

                                            <div className="flex gap-2 mb-5 shrink-0 bg-[#1A1A1A] p-3.5 rounded-xl border border-vps-gray/20">
                                                <select className="flex-1 bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-sm text-vps-ivory focus:border-blue-400 outline-none cursor-pointer" value={newEqName} onChange={e => setNewEqName(e.target.value)}>
                                                    <option value="">-- Chọn Thiết bị từ kho --</option>
                                                    {equipmentList.filter(eq => eq.status !== 'maintenance').map(eq => (
                                                        <option key={eq.id} value={eq.name}>{eq.name} ({eq.category})</option>
                                                    ))}
                                                </select>
                                                <button type="button" onClick={addEqToForm} disabled={!newEqName} className="bg-blue-500/20 hover:bg-blue-500 hover:text-white text-blue-400 disabled:opacity-30 disabled:hover:bg-blue-500/20 disabled:hover:text-blue-400 px-4 rounded-lg transition-colors shrink-0 flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 border-t border-vps-gray/10 pt-4">
                                                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Thiết bị mang theo ({schFormData.equipments.length})</h4>

                                                {schFormData.equipments.map((eq, index) => (
                                                    <div key={index} className="flex justify-between items-center bg-[#222] p-3 rounded-lg border border-vps-gray/20 hover:border-blue-500/30 transition-colors group">
                                                        <span className="text-sm font-medium text-gray-300 pr-2 leading-snug">{eq}</span>
                                                        <button type="button" onClick={() => removeEqFromForm(index)} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0" title="Xóa thiết bị"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                {schFormData.equipments.length === 0 && (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50 mt-4">
                                                        <Wrench className="w-8 h-8 text-gray-500 mb-2" />
                                                        <p className="text-xs text-gray-400">Chưa có thiết bị nào được thêm.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-4 md:p-5 border-t border-vps-gray/20 shrink-0 flex justify-end gap-3 md:gap-4 bg-[#222]">
                                <button type="button" onClick={() => setIsSchModalOpen(false)} className="px-5 md:px-6 py-2.5 md:py-3 bg-[#111] text-white font-bold rounded-xl hover:bg-[#333] transition-colors border border-vps-gray/20 text-sm md:text-base">Hủy</button>
                                <button type="submit" form="scheduleForm" className="px-6 md:px-8 py-2.5 md:py-3 bg-vps-gold text-vps-black font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)] text-sm md:text-base">Lưu Lịch Trình</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL THÊM THIẾT BỊ MỚI */}
                {isEqModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-7 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-vps-gold">Thêm Thiết Bị Mới</h2>
                                <button onClick={() => setIsEqModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleAddEquipment} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Hình ảnh thiết bị</label>
                                    <div className="border-2 border-dashed border-vps-gray/40 bg-[#111] rounded-xl p-4 flex flex-col items-center justify-center relative hover:border-vps-gold/50 transition-colors">
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        {eqImagePreview ? (
                                            <img src={eqImagePreview} alt="Preview" className="h-32 object-contain rounded-lg" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-vps-gray/10 rounded-full flex items-center justify-center mb-2">
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-400">Nhấn hoặc kéo thả ảnh</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên thiết bị *</label>
                                    <input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={eqFormData.name} onChange={e => setEqFormData({ ...eqFormData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phân loại</label>
                                        <select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none cursor-pointer" value={eqFormData.category} onChange={e => setEqFormData({ ...eqFormData, category: e.target.value })}>
                                            <option value="Camera">Máy quay</option>
                                            <option value="Lens">Ống kính</option>
                                            <option value="Lighting">Đèn</option>
                                            <option value="Audio">Âm thanh</option>
                                            <option value="Gimbal">Gimbal / Tripod</option>
                                            <option value="Other">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Trạng thái</label>
                                        <select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none cursor-pointer" value={eqFormData.status} onChange={e => setEqFormData({ ...eqFormData, status: e.target.value })}>
                                            <option value="available">Sẵn sàng</option>
                                            <option value="in-use">Đang đi quay</option>
                                            <option value="rental">Cho thuê</option>
                                            <option value="maintenance">Bảo trì</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-vps-gray/20">
                                    <button type="button" onClick={() => setIsEqModalOpen(false)} className="px-5 py-3.5 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333] transition-colors w-1/3">Hủy</button>
                                    <button type="submit" className="px-5 py-3.5 bg-vps-gold text-vps-black font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)] w-2/3">Lưu Vào Kho</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL CẬP NHẬT THIẾT BỊ */}
                {isEditEqModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-7 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-vps-gold">Cập Nhật Thiết Bị</h2>
                                <button onClick={() => setIsEditEqModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleUpdateEquipment} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Hình ảnh thiết bị</label>
                                    <div className="border-2 border-dashed border-vps-gray/40 bg-[#111] rounded-xl p-4 flex flex-col items-center justify-center relative hover:border-vps-gold/50 transition-colors">
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        {editEqImagePreview ? (
                                            <img src={editEqImagePreview} alt="Preview" className="h-32 object-contain rounded-lg" />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-vps-gray/10 rounded-full flex items-center justify-center mb-2">
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-400">Nhấn hoặc kéo thả để đổi ảnh</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên thiết bị *</label>
                                    <input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={editEqFormData.name} onChange={e => setEditEqFormData({ ...editEqFormData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phân loại</label>
                                        <select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none cursor-pointer" value={editEqFormData.category} onChange={e => setEditEqFormData({ ...editEqFormData, category: e.target.value })}>
                                            <option value="Camera">Máy quay</option>
                                            <option value="Lens">Ống kính</option>
                                            <option value="Lighting">Đèn</option>
                                            <option value="Audio">Âm thanh</option>
                                            <option value="Gimbal">Gimbal / Tripod</option>
                                            <option value="Other">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-vps-gold mb-2 uppercase tracking-wider">Trạng thái</label>
                                        <select className="w-full bg-[#111] border border-vps-gold/50 rounded-xl p-3.5 text-vps-gold focus:outline-none cursor-pointer font-medium" value={editEqFormData.status} onChange={e => setEditEqFormData({ ...editEqFormData, status: e.target.value })}>
                                            <option value="available">Sẵn sàng</option>
                                            <option value="in-use">Đang đi quay</option>
                                            <option value="rental">Cho thuê</option>
                                            <option value="maintenance">Bảo trì</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-vps-gray/20">
                                    <button type="button" onClick={() => setIsEditEqModalOpen(false)} className="px-5 py-3.5 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333] transition-colors w-1/3">Hủy</button>
                                    <button type="submit" className="px-5 py-3.5 bg-vps-gold text-vps-black font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)] w-2/3">Lưu Thay Đổi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default Production;