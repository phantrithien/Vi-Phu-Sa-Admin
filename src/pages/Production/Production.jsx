import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import {
    Camera, CalendarDays, Wrench, Video, Plus,
    Trash2, Cloud, Pencil, MapPin, Clock, Image as ImageIcon,
    Search, Filter, CheckCircle, AlertTriangle, PlayCircle, X,
    FileText, Sun, Coffee, Users
} from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const Production = () => {
    const { userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('callsheet'); // tabs: 'equipment', 'schedule', 'callsheet'

    const [searchTerm, setSearchTerm] = useState('');
    const [filterOption, setFilterOption] = useState('All');

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
    const [schFormData, setSchFormData] = useState({ projectName: '', date: '', location: '', status: 'upcoming' });

    // --- LỆNH GỌI QUAY (CALL SHEET) ---
    const [callSheetList, setCallSheetList] = useState([]);
    const [loadingCs, setLoadingCs] = useState(true);
    const [isCsModalOpen, setIsCsModalOpen] = useState(false);

    // Template HTML mặc định cho phần nội dung bảng biểu của Call Sheet
    const defaultCsContent = `
        <p><strong style="color: #ff4d4f;">** NO SOCIAL MEDIA - CLOSED SET **</strong></p>
        <p><strong>Questions?</strong> Call Jack Doe (xxx) xxx-xxxx | <strong>Walkie Assignments:</strong> (5)</p><br/>
        
        <h3>🎬 SCENES - SET AND DESCRIPTION</h3>
        <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
            <tr style="background-color: #222;"><th>SCENES</th><th>SET AND DESCRIPTION</th><th>CHARACTER</th><th>D/N</th><th>PAGES</th><th>LOCATION/NOTES</th></tr>
            <tr><td>1</td><td>[Nhập Tên bối cảnh]</td><td></td><td>Day</td><td>1/8</td><td></td></tr>
            <tr><td>2</td><td></td><td></td><td></td><td></td><td></td></tr>
        </table><br/>

        <h3>🎭 CAST & CHARACTERS</h3>
        <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
            <tr style="background-color: #222;"><th>CAST</th><th>CHARACTERS</th><th>W/H/M/U</th><th>SET</th><th>MINOR?</th><th>SPECIAL INSTRUCTIONS</th></tr>
            <tr><td>[Tên DV]</td><td>[Vai diễn]</td><td>07:00</td><td>08:00</td><td>N</td><td></td></tr>
        </table><br/>

        <h3>🎥 CREW POSITIONS</h3>
        <table style="width: 100%; border-collapse: collapse;" border="1" cellpadding="5">
            <tr style="background-color: #222;"><th>POSITION</th><th>NAME</th><th>PHONE</th><th>IN</th></tr>
            <tr><td>Director</td><td></td><td></td><td></td></tr>
            <tr><td>Dir. of Photography</td><td></td><td></td><td></td></tr>
            <tr><td>1st AD</td><td></td><td></td><td></td></tr>
            <tr><td>Set PA</td><td></td><td></td><td></td></tr>
        </table><br/>

        <h3>📌 PRODUCTION NOTES</h3>
        <ul><li>Production Note 1</li><li>Allowed Guests: None</li><li>Special Props: ...</li></ul>
    `;

    const initialCsState = {
        title: '', shootDate: '', dayXofY: 'Day 1 of 1', callTime: '09:00 AM',
        producer: '', director: '', upm: '',
        breakfast: '08:00 AM', lunch: '01:00 PM',
        sunrise: '06:15 AM', sunset: '05:50 PM',
        weather: '70° AM | 80° NOON | Humidity 10% | Mostly Sunny',
        hospital: '', address: '',
        content: defaultCsContent
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

    // LẮNG NGHE DỮ LIỆU
    useEffect(() => {
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

        return () => { unsubEq(); unsubSch(); unsubCs(); };
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
    const handleAddSchedule = async (e) => {
        e.preventDefault();
        try {
            if (editEqFormData.id && isSchModalOpen) {
                await updateDoc(doc(db, 'schedules', editEqFormData.id), { ...schFormData });
            } else {
                await addDoc(collection(db, 'schedules'), { ...schFormData, timestamp: new Date().getTime() });
            }
            setIsSchModalOpen(false); setSchFormData({ projectName: '', date: '', location: '', status: 'upcoming' }); setEditEqFormData({ id: '' });
        } catch (error) { alert("Lỗi xử lý lịch quay!"); }
    };
    const openEditSchedule = (item) => {
        setSchFormData({ projectName: item.projectName, date: item.date, location: item.location, status: item.status }); setEditEqFormData({ id: item.id }); setIsSchModalOpen(true);
    };
    const handleDeleteSchedule = async (id) => { if (window.confirm("Hủy lịch quay này?")) await deleteDoc(doc(db, 'schedules', id)); };

    // --- HANDLERS: CALL SHEET ---
    const handleSaveCallSheet = async (e) => {
        e.preventDefault();
        try {
            if (editingCsId) {
                await updateDoc(doc(db, 'callsheets', editingCsId), { ...csFormData });
            } else {
                await addDoc(collection(db, 'callsheets'), { ...csFormData, timestamp: new Date().getTime() });
            }
            setIsCsModalOpen(false); setCsFormData(initialCsState); setEditingCsId(null);
        } catch (error) { alert("Lỗi lưu Call Sheet!"); }
    };
    const openEditCallSheet = (item) => {
        setCsFormData({ ...item }); setEditingCsId(item.id); setIsCsModalOpen(true);
    };
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

    // --- TÍNH TOÁN RENDER THỐNG KÊ ---
    const renderAnalytics = () => {
        if (activeTab === 'equipment') {
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
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Sẵn sàng (Kho)</p><h3 className="text-3xl font-bold text-green-400">{available}</h3></div>
                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đang đi quay</p><h3 className="text-3xl font-bold text-blue-400">{inUse}</h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><PlayCircle className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-red-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đang bảo trì</p><h3 className="text-3xl font-bold text-red-400">{maintenance}</h3></div>
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
                        </div>
                    </div>
                </div>
            );
        } else if (activeTab === 'schedule') {
            const upcoming = scheduleList.filter(s => s.status === 'upcoming').length;
            const inProgress = scheduleList.filter(s => s.status === 'in-progress').length;
            const completed = scheduleList.filter(s => s.status === 'completed').length;
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Lịch sắp tới</p><h3 className="text-3xl font-bold text-blue-400">{upcoming}</h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><CalendarDays className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-vps-gold/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-vps-gold/5 rounded-full blur-2xl group-hover:bg-vps-gold/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đang On-Set</p><h3 className="text-3xl font-bold text-vps-gold">{inProgress}</h3></div>
                            <div className="p-3 bg-vps-gold/10 rounded-xl border border-vps-gold/20"><Video className="w-6 h-6 text-vps-gold" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đã hoàn thành</p><h3 className="text-3xl font-bold text-green-400">{completed}</h3></div>
                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><CheckCircle className="w-6 h-6 text-green-400" /></div>
                        </div>
                    </div>
                </div>
            );
        } else {
            // Analytics cho Call Sheet
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Lệnh Gọi Quay</p><h3 className="text-3xl font-bold text-blue-400">{callSheetList.length}</h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><FileText className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-vps-gold/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-vps-gold/5 rounded-full blur-2xl group-hover:bg-vps-gold/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Cập nhật mới nhất</p>
                                <h3 className="text-lg font-bold text-vps-gold mt-1">{callSheetList.length > 0 ? callSheetList[0].title : 'Chưa có dữ liệu'}</h3></div>
                            <div className="p-3 bg-vps-gold/10 rounded-xl border border-vps-gold/20"><Clock className="w-6 h-6 text-vps-gold" /></div>
                        </div>
                    </div>
                </div>
            )
        }
    };

    // Filter Logic
    const filteredEquipment = equipmentList.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterOption === 'All' || item.status === filterOption;
        return matchSearch && matchFilter;
    });

    const filteredSchedule = scheduleList.filter(item => {
        const matchSearch = item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || item.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterOption === 'All' || item.status === filterOption;
        return matchSearch && matchFilter;
    });

    const filteredCallSheets = callSheetList.filter(item => {
        return item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.director.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex w-full max-w-[100vw] overflow-x-hidden relative text-vps-ivory">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-5 pt-24 md:p-10 md:pt-10 overflow-y-auto w-full">

                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold drop-shadow-md">Vận hành Sản xuất</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                <Cloud className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Đã đồng bộ</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Quản lý kho thiết bị và điều phối lịch quay dự án On-set.</p>
                    </div>

                    {userRole !== 'back_office' && (
                        <button
                            onClick={() => {
                                if (activeTab === 'equipment') {
                                    setEqFormData(initialEqState); setEqImagePreview(null); setEqImageFile(null); setIsEqModalOpen(true);
                                } else if (activeTab === 'schedule') {
                                    setSchFormData({ projectName: '', date: '', location: '', status: 'upcoming' }); setEditEqFormData({ id: '' }); setIsSchModalOpen(true);
                                } else {
                                    setCsFormData(initialCsState); setEditingCsId(null); setIsCsModalOpen(true);
                                }
                            }}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{activeTab === 'equipment' ? 'Thêm Thiết Bị' : activeTab === 'schedule' ? 'Tạo Lịch Quay' : 'Tạo Call Sheet'}</span>
                        </button>
                    )}
                </div>

                <div className="flex overflow-x-auto gap-3 mb-10 custom-scrollbar pb-2">
                    <button onClick={() => setActiveTab('equipment')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'equipment' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}>
                        <Camera className="w-5 h-5" /> Kho Thiết bị
                    </button>
                    <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'schedule' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}>
                        <CalendarDays className="w-5 h-5" /> Lịch Bấm máy
                    </button>
                    <button onClick={() => setActiveTab('callsheet')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'callsheet' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}>
                        <FileText className="w-5 h-5" /> Call Sheet
                    </button>
                </div>

                {renderAnalytics()}

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input type="text" placeholder={`Tìm kiếm ${activeTab === 'equipment' ? 'thiết bị...' : activeTab === 'schedule' ? 'tên dự án...' : 'tên phim/tập...'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors" />
                    </div>
                    {activeTab !== 'callsheet' && (
                        <div className="relative min-w-[200px]">
                            <select value={filterOption} onChange={(e) => setFilterOption(e.target.value)} className="w-full appearance-none h-full px-5 py-3.5 pr-10 bg-[#1A1A1A] border border-vps-gray/20 rounded-xl text-vps-ivory hover:border-vps-gold/50 focus:outline-none focus:border-vps-gold transition-colors cursor-pointer text-sm font-semibold">
                                <option value="All">Tất cả trạng thái</option>
                                {activeTab === 'equipment' ? (
                                    <><option value="available">Sẵn sàng</option><option value="in-use">Đang đi quay</option><option value="maintenance">Bảo trì</option><option value="rental">Cho thuê</option></>
                                ) : (
                                    <><option value="upcoming">Sắp tới</option><option value="in-progress">Đang quay</option><option value="completed">Đã hoàn thành</option></>
                                )}
                            </select>
                            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* --- TAB: KHO THIẾT BỊ --- */}
                {activeTab === 'equipment' && (
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
                                                {userRole !== 'back_office' && (
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
                )}

                {/* --- TAB: LỊCH BẤM MÁY --- */}
                {activeTab === 'schedule' && (
                    <>
                        {loadingSch ? <div className="text-center text-vps-gold animate-pulse py-20 font-semibold">Đang tải lịch trình...</div>
                            : filteredSchedule.length === 0 ? <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl p-16 text-center shadow-xl"><CalendarDays className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400 font-medium">Chưa có lịch trình nào hoặc không tìm thấy kết quả.</p></div>
                                : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredSchedule.map(item => (
                                            <div key={item.id} className="bg-[#1A1A1A] border-l-4 border-l-vps-gold border border-vps-gray/20 p-6 rounded-r-2xl rounded-l-sm shadow-xl relative group hover:-translate-y-1 transition-transform">
                                                {userRole !== 'back_office' && (
                                                    <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditSchedule(item)} className="p-2 text-vps-gold hover:bg-vps-gold/10 rounded-lg"><Pencil className="w-4 h-4" /></button>
                                                        {['founder', 'front_office'].includes(userRole) && (<button onClick={() => handleDeleteSchedule(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>)}
                                                    </div>
                                                )}
                                                <div className="mb-4 pr-16">
                                                    <span className={`inline-block mb-3 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getSchStatusColor(item.status)}`}>
                                                        {item.status === 'upcoming' ? 'Sắp tới' : item.status === 'in-progress' ? 'Đang quay' : 'Hoàn thành'}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-vps-ivory line-clamp-2">{item.projectName}</h3>
                                                </div>
                                                <div className="space-y-3 mt-4 text-sm font-medium bg-[#222] p-4 rounded-xl border border-vps-gray/10">
                                                    <div className="flex items-center gap-3"><div className="p-1.5 bg-vps-gold/10 rounded-md"><Clock className="w-4 h-4 text-vps-gold" /></div><span className="text-gray-300">{item.date.replace('T', ' - ')}</span></div>
                                                    <div className="flex items-center gap-3"><div className="p-1.5 bg-vps-gold/10 rounded-md"><MapPin className="w-4 h-4 text-vps-gold" /></div><span className="text-gray-300 line-clamp-1">{item.location}</span></div>
                                                </div>
                                            </div>
                                        ))}
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
                                                    {userRole !== 'back_office' && (
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


                {/* MODAL CALL SHEET - FULL SCREEN */}
                {isCsModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                            {/* Header Modal */}
                            <div className="bg-[#222] border-b border-vps-gray/20 p-5 flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold text-vps-gold flex items-center gap-2"><FileText className="w-5 h-5" /> {editingCsId ? 'Chỉnh Sửa Call Sheet' : 'Tạo Call Sheet Mới'}</h2>
                                <button onClick={() => setIsCsModalOpen(false)} className="text-gray-500 hover:text-white bg-[#111] p-2 rounded-full"><X className="w-5 h-5" /></button>
                            </div>

                            {/* Body Modal (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <form id="csForm" onSubmit={handleSaveCallSheet} className="space-y-8">

                                    {/* SECTION 1: HEADER INFO */}
                                    <div className="bg-[#111] border border-vps-gray/20 p-6 rounded-xl space-y-5">
                                        <h3 className="text-sm font-bold text-vps-gold uppercase tracking-wider mb-4 border-b border-vps-gray/20 pb-2">Thông Tin Chung</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-400 mb-1">Tên Dự án / Tập phim *</label><input required type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.title} onChange={e => setCsFormData({ ...csFormData, title: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Shoot Date *</label><input required type="date" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark]" value={csFormData.shootDate} onChange={e => setCsFormData({ ...csFormData, shootDate: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Day X of Y</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.dayXofY} onChange={e => setCsFormData({ ...csFormData, dayXofY: e.target.value })} placeholder="Day 1 of 5" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div><label className="block text-xs font-bold text-vps-gold mb-1">GENERAL CALL TIME *</label><input required type="text" className="w-full bg-vps-gold/10 border border-vps-gold/30 rounded-lg p-2.5 text-vps-gold font-bold focus:outline-none" value={csFormData.callTime} onChange={e => setCsFormData({ ...csFormData, callTime: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-blue-400 mb-1">Breakfast Time</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-blue-400 focus:border-vps-gold outline-none" value={csFormData.breakfast} onChange={e => setCsFormData({ ...csFormData, breakfast: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-orange-400 mb-1">Lunch Time</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-orange-400 focus:border-vps-gold outline-none" value={csFormData.lunch} onChange={e => setCsFormData({ ...csFormData, lunch: e.target.value })} /></div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: PRODUCTION TEAM & LOCATIONS */}
                                    <div className="bg-[#111] border border-vps-gray/20 p-6 rounded-xl space-y-5">
                                        <h3 className="text-sm font-bold text-vps-gold uppercase tracking-wider mb-4 border-b border-vps-gray/20 pb-2">Nhân Sự & Địa Điểm</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Director</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.director} onChange={e => setCsFormData({ ...csFormData, director: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Producer</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.producer} onChange={e => setCsFormData({ ...csFormData, producer: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">UPM (Unit Prod. Mgr)</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.upm} onChange={e => setCsFormData({ ...csFormData, upm: e.target.value })} /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Địa chỉ Set Quay (Address 1/2)</label><textarea className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none resize-none" rows="2" value={csFormData.address} onChange={e => setCsFormData({ ...csFormData, address: e.target.value })}></textarea></div>
                                            <div><label className="block text-xs font-bold text-red-400 mb-1">Bệnh viện gần nhất (Nearest Hospital)</label><textarea className="w-full bg-[#222] border border-red-500/30 rounded-lg p-2.5 text-red-400 focus:border-red-500 outline-none resize-none" rows="2" value={csFormData.hospital} onChange={e => setCsFormData({ ...csFormData, hospital: e.target.value })}></textarea></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Sun className="w-3 h-3" /> Weather Details</label><input type="text" className="w-full bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.weather} onChange={e => setCsFormData({ ...csFormData, weather: e.target.value })} /></div>
                                            <div><label className="block text-xs font-bold text-gray-400 mb-1">Sunrise / Sunset</label><div className="flex gap-2"><input type="text" className="w-1/2 bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.sunrise} onChange={e => setCsFormData({ ...csFormData, sunrise: e.target.value })} placeholder="Mọc" /><input type="text" className="w-1/2 bg-[#222] border border-vps-gray/20 rounded-lg p-2.5 text-vps-ivory focus:border-vps-gold outline-none" value={csFormData.sunset} onChange={e => setCsFormData({ ...csFormData, sunset: e.target.value })} placeholder="Lặn" /></div></div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: SCENES, CAST & CREW (RICH TEXT EDITOR) */}
                                    <div className="bg-[#111] border border-vps-gray/20 p-6 rounded-xl space-y-5">
                                        <h3 className="text-sm font-bold text-vps-gold uppercase tracking-wider mb-2 border-b border-vps-gray/20 pb-2">Bảng Chi Tiết (Scenes, Cast, Crew)</h3>
                                        <p className="text-xs text-gray-400 mb-4">Mẹo: Bạn có thể nhập trực tiếp vào bảng mẫu dưới đây hoặc Copy/Paste bảng từ Excel/Word vào khung soạn thảo.</p>
                                        <div className="quill-dark-theme bg-[#222] rounded-xl border border-vps-gray/20 overflow-hidden min-h-[400px]">
                                            <ReactQuill
                                                theme="snow"
                                                modules={quillModules}
                                                value={csFormData.content}
                                                onChange={val => setCsFormData({ ...csFormData, content: val })}
                                            />
                                        </div>
                                    </div>

                                </form>
                            </div>

                            {/* Footer Modal */}
                            <div className="bg-[#222] border-t border-vps-gray/20 p-5 shrink-0 flex justify-end gap-4">
                                <button type="button" onClick={() => setIsCsModalOpen(false)} className="px-6 py-3 bg-[#111] border border-vps-gray/20 text-vps-ivory rounded-xl font-bold hover:bg-[#333] transition-colors">Hủy Bỏ</button>
                                <button type="submit" form="csForm" className="px-8 py-3 bg-vps-gold text-vps-black rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]">Lưu Call Sheet</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL THIẾT BỊ / LỊCH TRÌNH (Giữ nguyên như trước) */}
                {/* ... Các phần Modal Thiết bị và Lịch quay ... */}
                {isSchModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-7 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-vps-gold">{editEqFormData.id ? 'Cập Nhật Lịch Quay' : 'Tạo Lịch Quay Mới'}</h2>
                                <button onClick={() => setIsSchModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleAddSchedule} className="space-y-5">
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên dự án / Cảnh quay *</label><input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={schFormData.projectName} onChange={e => setSchFormData({ ...schFormData, projectName: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ngày giờ *</label><input required type="datetime-local" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none [color-scheme:dark]" value={schFormData.date} onChange={e => setSchFormData({ ...schFormData, date: e.target.value })} /></div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Trạng thái</label><select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={schFormData.status} onChange={e => setSchFormData({ ...schFormData, status: e.target.value })}><option value="upcoming">Sắp tới</option><option value="in-progress">Đang quay</option><option value="completed">Đã hoàn thành</option></select></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Địa điểm / Studio *</label><input required type="text" placeholder="VD: Studio 1, Quán Cafe X..." className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={schFormData.location} onChange={e => setSchFormData({ ...schFormData, location: e.target.value })} /></div>
                                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-vps-gray/20">
                                    <button type="button" onClick={() => setIsSchModalOpen(false)} className="px-5 py-3.5 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333] transition-colors w-1/3">Hủy</button>
                                    <button type="submit" className="px-5 py-3.5 bg-vps-gold text-vps-black font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)] w-2/3">Lưu Lịch Trình</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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
                                        {eqImagePreview ? <img src={eqImagePreview} alt="Preview" className="h-32 object-contain rounded-lg" /> : <><div className="w-12 h-12 bg-vps-gray/10 rounded-full flex items-center justify-center mb-2"><ImageIcon className="w-6 h-6 text-gray-400" /></div><span className="text-sm font-medium text-gray-400">Nhấn hoặc kéo thả ảnh</span></>}
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên thiết bị *</label><input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={eqFormData.name} onChange={e => setEqFormData({ ...eqFormData, name: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phân loại</label><select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={eqFormData.category} onChange={e => setEqFormData({ ...eqFormData, category: e.target.value })}><option value="Camera">Máy quay</option><option value="Lens">Ống kính</option><option value="Lighting">Đèn</option><option value="Audio">Âm thanh</option><option value="Gimbal">Gimbal / Tripod</option><option value="Other">Khác</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Trạng thái</label><select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={eqFormData.status} onChange={e => setEqFormData({ ...eqFormData, status: e.target.value })}><option value="available">Sẵn sàng</option><option value="in-use">Đang đi quay</option><option value="rental">Cho thuê</option><option value="maintenance">Bảo trì</option></select></div>
                                </div>
                                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-vps-gray/20">
                                    <button type="button" onClick={() => setIsEqModalOpen(false)} className="px-5 py-3.5 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333] transition-colors w-1/3">Hủy</button>
                                    <button type="submit" className="px-5 py-3.5 bg-vps-gold text-vps-black font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)] w-2/3">Lưu Vào Kho</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

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
                                        {editEqImagePreview ? <img src={editEqImagePreview} alt="Preview" className="h-32 object-contain rounded-lg" /> : <><div className="w-12 h-12 bg-vps-gray/10 rounded-full flex items-center justify-center mb-2"><ImageIcon className="w-6 h-6 text-gray-400" /></div><span className="text-sm font-medium text-gray-400">Nhấn hoặc kéo thả để đổi ảnh</span></>}
                                    </div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Tên thiết bị *</label><input required type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={editEqFormData.name} onChange={e => setEditEqFormData({ ...editEqFormData, name: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Phân loại</label><select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none" value={editEqFormData.category} onChange={e => setEditEqFormData({ ...editEqFormData, category: e.target.value })}><option value="Camera">Máy quay</option><option value="Lens">Ống kính</option><option value="Lighting">Đèn</option><option value="Audio">Âm thanh</option><option value="Gimbal">Gimbal / Tripod</option><option value="Other">Khác</option></select></div>
                                    <div><label className="block text-xs font-bold text-vps-gold mb-2 uppercase tracking-wider">Trạng thái</label><select className="w-full bg-[#111] border border-vps-gold/50 rounded-xl p-3.5 text-vps-gold focus:outline-none" value={editEqFormData.status} onChange={e => setEditEqFormData({ ...editEqFormData, status: e.target.value })}><option value="available">Sẵn sàng</option><option value="in-use">Đang đi quay</option><option value="rental">Cho thuê</option><option value="maintenance">Bảo trì</option></select></div>
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
        </div>
    );
};

export default Production;