import React, { useState, useEffect } from 'react';
import AppShell from '../../components/AppShell';
import {
    Plus, Search, Edit, Trash2, Cloud,
    Megaphone, Target, ShieldAlert,
    Star, MessageCircle, X, Save,
    Users, DollarSign, Activity, PieChart, Briefcase,
    Zap, Award, BarChart3, Crosshair, Filter, Image as ImageIcon,
    Download, Copy, Check, CheckCircle2, XCircle
} from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '../../contexts/AuthContext';

// Import Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Marketing = () => {
    const { userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('campaigns');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOption, setFilterOption] = useState('All');
    const [loading, setLoading] = useState(true);

    const [campaigns, setCampaigns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [competitors, setCompetitors] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});

    const [draggingSpent, setDraggingSpent] = useState({});

    // State cho Brand Guidelines
    const [brandTab, setBrandTab] = useState('core');
    const [copiedColor, setCopiedColor] = useState(null);

    const handleCopyHex = (hex) => {
        navigator.clipboard.writeText(hex);
        setCopiedColor(hex);
        setTimeout(() => setCopiedColor(null), 1500);
    };

    useEffect(() => {
        setFilterOption('All');
    }, [activeTab]);

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    useEffect(() => {
        const unsubCampaigns = onSnapshot(collection(db, 'marketing_campaigns'), async (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCampaigns(list);

            const totalSpent = list.reduce((sum, c) => sum + (Number(c.spent) || 0), 0);

            try {
                await setDoc(doc(db, 'accounting_sync', 'marketing_expenses'), {
                    name: 'Tổng chi phí thực tế Marketing',
                    amount: totalSpent,
                    type: 'chi_phi',
                    category: 'Marketing',
                    updatedAt: Date.now()
                }, { merge: true });
            } catch (error) {
                console.error("Lỗi tự động đồng bộ sang Kế toán:", error);
            }
        });

        const unsubCustomers = onSnapshot(collection(db, 'customer_care'), (snap) => {
            setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubCompetitors = onSnapshot(collection(db, 'competitors'), (snap) => {
            setCompetitors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => { unsubCampaigns(); unsubCustomers(); unsubCompetitors(); };
    }, []);

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({ ...item });
        } else {
            setEditingId(null);
            if (activeTab === 'campaigns') setFormData({ name: '', budget: '', spent: '', leads: '', status: 'Đang chạy', platform: 'Facebook', startDate: '', endDate: '', kpi: '' });
            if (activeTab === 'customers') setFormData({ name: '', phone: '', dealValue: '', priority: 'Tiềm năng', pipeline: 'Khách mới', source: 'Facebook', lastContact: '', notes: '', rating: '3' });
            // CẬP NHẬT: field pricing khởi tạo là chuỗi rỗng
            if (activeTab === 'competitors') setFormData({ name: '', threatLevel: 'Trung bình', pricing: '', equipment: '', strength: '', weakness: '', actionPlan: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({});
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const collectionName =
                activeTab === 'campaigns' ? 'marketing_campaigns' :
                    activeTab === 'customers' ? 'customer_care' : 'competitors';

            let payload = { ...formData };
            if (activeTab === 'campaigns') {
                payload.budget = parseInt(String(formData.budget).replace(/[^0-9]/g, ''), 10) || 0;
                payload.spent = parseInt(String(formData.spent).replace(/[^0-9]/g, ''), 10) || 0;
                payload.leads = parseInt(String(formData.leads).replace(/[^0-9]/g, ''), 10) || 0;
            }
            if (activeTab === 'customers') {
                payload.dealValue = parseInt(String(formData.dealValue).replace(/[^0-9]/g, ''), 10) || 0;
            }
            // CẬP NHẬT: Ép kiểu pricing về integer để có thể tính toán toán học
            if (activeTab === 'competitors') {
                payload.pricing = parseInt(String(formData.pricing).replace(/[^0-9]/g, ''), 10) || 0;
            }

            if (editingId) {
                await updateDoc(doc(db, collectionName, editingId), payload);
            } else {
                await addDoc(collection(db, collectionName), { ...payload, createdAt: Date.now() });
            }
            closeModal();
        } catch (error) {
            console.error("Lỗi lưu dữ liệu:", error);
            alert("Lỗi khi lưu! Vui lòng kiểm tra lại kết nối.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
        const collectionName =
            activeTab === 'campaigns' ? 'marketing_campaigns' :
                activeTab === 'customers' ? 'customer_care' : 'competitors';
        await deleteDoc(doc(db, collectionName, id));
    };

    const getCRMStats = () => {
        const wonValue = customers.filter(c => c.pipeline === 'Đã chốt').reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
        const conversionRate = customers.length > 0 ? Math.round((customers.filter(c => c.pipeline === 'Đã chốt').length / customers.length) * 100) : 0;
        return { wonValue, conversionRate };
    };

    const renderAnalytics = () => {
        if (activeTab === 'campaigns') {
            const totalBudget = campaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0);
            const totalSpent = campaigns.reduce((sum, c) => sum + (Number(c.spent) || 0), 0);
            const totalLeads = campaigns.reduce((sum, c) => sum + (Number(c.leads) || 0), 0);
            const avgCPL = totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0;

            const chartData = {
                labels: campaigns.slice(0, 5).map(c => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name),
                datasets: [
                    { label: 'Ngân sách (VNĐ)', data: campaigns.slice(0, 5).map(c => c.budget || 0), backgroundColor: 'rgba(74, 222, 128, 0.6)', borderRadius: 4 },
                    { label: 'Đã chi tiêu (VNĐ)', data: campaigns.slice(0, 5).map(c => c.spent || 0), backgroundColor: 'rgba(251, 146, 60, 0.8)', borderRadius: 4 }
                ]
            };

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Chiến dịch Active</p>
                                    <h3 className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight">{campaigns.filter(c => c.status === 'Đang chạy').length}</h3>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><Activity className="w-6 h-6 text-blue-400" /></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-yellow-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Leads thu về</p>
                                    <h3 className="text-2xl md:text-3xl font-bold text-vps-gold tracking-tight">{totalLeads}</h3>
                                </div>
                                <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><Users className="w-6 h-6 text-vps-gold" /></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Ngân sách Tổng</p>
                                    <h3 className="text-xl md:text-2xl font-bold text-green-400 tracking-tight truncate">{formatCurrency(totalBudget)}</h3>
                                </div>
                                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><DollarSign className="w-6 h-6 text-green-400" /></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Avg CPL (Giá/Lead)</p>
                                    <h3 className="text-xl md:text-2xl font-bold text-orange-400 tracking-tight truncate">{formatCurrency(avgCPL)}</h3>
                                </div>
                                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20"><Crosshair className="w-6 h-6 text-orange-400" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-vps-gray/20 p-7 rounded-2xl shadow-xl mb-10">
                        <h3 className="font-bold text-lg text-vps-ivory mb-6 tracking-wide">Top 5 Chiến dịch (Ngân sách vs Tiêu hao)</h3>
                        <div className="h-64"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#888' } } }, scales: { y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#888' }, grid: { display: false } } } }} /></div>
                    </div>
                </>
            );
        }

        if (activeTab === 'customers') {
            const won = customers.filter(c => c.pipeline === 'Đã chốt').length;
            const expectedValue = customers.filter(c => c.pipeline !== 'Thất bại').reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
            const wonValue = customers.filter(c => c.pipeline === 'Đã chốt').reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);

            const totalLeads = customers.length;
            const newLeadsCount = customers.filter(c => c.pipeline === 'Khách mới').length;
            const consultingLeadsCount = customers.filter(c => c.pipeline === 'Đang tư vấn').length;
            const wonLeadsCount = customers.filter(c => c.pipeline === 'Đã chốt').length;
            const lostLeadsCount = customers.filter(c => c.pipeline === 'Thất bại').length;

            const pipelineData = {
                labels: ['Khách mới', 'Đang tư vấn', 'Đã chốt', 'Thất bại'],
                datasets: [{
                    data: [newLeadsCount, consultingLeadsCount, wonLeadsCount, lostLeadsCount],
                    backgroundColor: [
                        'rgba(156, 163, 175, 0.9)',
                        'rgba(59, 130, 246, 0.9)',
                        'rgba(34, 197, 94, 0.9)',
                        'rgba(239, 68, 68, 0.9)'
                    ],
                    hoverOffset: 6,
                    borderWidth: 3,
                    borderColor: '#1A1A1A'
                }]
            };

            const doughnutOptions = {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 17, 17, 0.9)',
                        titleColor: '#D4AF37',
                        bodyColor: '#fff',
                        borderColor: 'rgba(212,175,55,0.2)',
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4
                    }
                },
                cutout: '75%'
            };

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {/* Các thẻ chỉ số tổng quan giữ nguyên */}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="lg:col-span-1 bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-vps-gray/20 p-7 rounded-2xl shadow-xl flex flex-col items-center relative overflow-hidden group">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-purple-500/10 transition-all duration-1000"></div>

                            <h3 className="font-bold text-lg text-vps-ivory mb-6 tracking-wide w-full text-left flex items-center gap-2 relative z-10">
                                <PieChart className="w-5 h-5 text-purple-400" />
                                Phân bổ Phễu
                            </h3>

                            <div className="relative w-52 h-52 mb-8 z-10 transition-transform duration-500 hover:scale-105">
                                <Doughnut data={pipelineData} options={doughnutOptions} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                                    <span className="text-3xl font-bold text-vps-ivory">{totalLeads}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-medium">Tổng Leads</span>
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-3 relative z-10">
                                <div className="flex items-center justify-between bg-[#111] px-3 py-2.5 rounded-xl border border-gray-500/20 hover:border-gray-500/50 transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]"></div><span className="text-xs text-gray-400">Khách mới</span></div>
                                    <span className="text-sm font-bold text-vps-ivory">{newLeadsCount}</span>
                                </div>
                                <div className="flex items-center justify-between bg-[#111] px-3 py-2.5 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div><span className="text-xs text-gray-400">Tư vấn</span></div>
                                    <span className="text-sm font-bold text-vps-ivory">{consultingLeadsCount}</span>
                                </div>
                                <div className="flex items-center justify-between bg-[#111] px-3 py-2.5 rounded-xl border border-green-500/20 hover:border-green-500/50 transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div><span className="text-xs text-gray-400">Đã chốt</span></div>
                                    <span className="text-sm font-bold text-vps-ivory">{wonLeadsCount}</span>
                                </div>
                                <div className="flex items-center justify-between bg-[#111] px-3 py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div><span className="text-xs text-gray-400">Thất bại</span></div>
                                    <span className="text-sm font-bold text-vps-ivory">{lostLeadsCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-vps-gray/20 p-8 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden group">
                            {/* Component Thẻ Hiệu Suất  */}
                        </div>
                    </div>
                </>
            );
        }

        if (activeTab === 'competitors') {
            // CẬP NHẬT: Tính toán Mức giá trung bình của các đối thủ
            const validPrices = competitors.filter(c => c.pricing > 0).map(c => Number(c.pricing));
            const avgPrice = validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : 0;

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đang theo dõi</p><h3 className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight">{competitors.length} <span className="text-lg font-normal text-gray-500">đối thủ</span></h3></div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><ShieldAlert className="w-6 h-6 text-blue-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-red-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Đe dọa mức CAO</p><h3 className="text-2xl md:text-3xl font-bold text-red-400 tracking-tight">{competitors.filter(c => c.threatLevel === 'Cao').length}</h3></div>
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"><Activity className="w-6 h-6 text-red-400" /></div>
                        </div>
                    </div>
                    {/* CẬP NHẬT: Thẻ phân tích giá thay vì Phân khúc Cao Cấp */}
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Giá TB Cạnh Tranh</p><h3 className="text-xl md:text-2xl font-bold text-purple-400 tracking-tight truncate">{formatCurrency(avgPrice)}</h3></div>
                            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20"><DollarSign className="w-6 h-6 text-purple-400" /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tình trạng Dữ liệu</p><h3 className="text-xl md:text-2xl font-bold text-green-400 tracking-tight mt-1">Real-time</h3></div>
                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><Zap className="w-6 h-6 text-green-400" /></div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    const renderCampaigns = () => {
        const filtered = campaigns.filter(c => {
            const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterOption === 'All' || c.status === filterOption;
            return matchSearch && matchFilter;
        });

        return (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10 animate-fadeIn">
                {/* --- CỘT TRÁI: BẢNG CHIẾN DỊCH --- */}
                <div className="xl:col-span-2 bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden h-fit">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                    <th className="p-5 font-semibold">Chiến Dịch & Nền tảng</th>
                                    <th className="p-5 font-semibold">Chỉ số Hiệu suất</th>
                                    <th className="p-5 font-semibold w-64">Tiến độ Ngân sách</th>
                                    <th className="p-5 font-semibold text-center">Trạng Thái</th>
                                    {userRole !== 'back_office' && <th className="p-5 font-semibold text-center">Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-vps-gray/10">
                                {filtered.length === 0 ? <tr><td colSpan={userRole !== 'back_office' ? "5" : "4"} className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu.</td></tr> :
                                    filtered.map(item => {
                                        const cpl = item.leads > 0 ? Math.round(item.spent / item.leads) : 0;
                                        const currentSpent = draggingSpent[item.id] !== undefined ? draggingSpent[item.id] : (item.spent || 0);
                                        const percent = item.budget ? Math.min(Math.round((currentSpent / item.budget) * 100), 100) : 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-[#222] transition-colors group">
                                                <td className="p-5">
                                                    <div className="font-bold text-vps-gold text-sm group-hover:text-yellow-400 transition-colors">{item.name}</div>
                                                    <span className="inline-block mt-2 bg-[#2A2A2A] px-2 py-0.5 rounded text-[10px] text-vps-ivory/80 font-medium tracking-wide">{item.platform}</span>
                                                    <div className="text-[10px] text-gray-500 mt-1.5">{item.startDate || '--'} đến {item.endDate || '--'}</div>
                                                </td>
                                                <td className="p-5 text-sm text-vps-ivory/80 space-y-1.5">
                                                    <div className="flex gap-2"><span className="text-gray-500">Leads:</span> <span className="font-bold text-vps-gold">{item.leads || 0}</span></div>
                                                    <div className="flex gap-2"><span className="text-gray-500">CPL:</span> <span className="text-orange-400 font-medium">{formatCurrency(cpl)}/lead</span></div>
                                                    {item.kpi && <div className="text-gray-500 italic truncate w-40 text-xs" title={item.kpi}>Mục tiêu: {item.kpi}</div>}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex justify-between text-[11px] mb-2 font-medium">
                                                        <span className="text-orange-400">Đã tiêu: {formatCurrency(currentSpent)}</span>
                                                        <span className="text-gray-500">Hạn mức: {formatCurrency(item.budget)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={item.budget || 0}
                                                            value={currentSpent}
                                                            disabled={userRole === 'back_office'}
                                                            onChange={(e) => setDraggingSpent({ ...draggingSpent, [item.id]: parseInt(e.target.value, 10) || 0 })}
                                                            onMouseUp={async () => {
                                                                if (userRole !== 'back_office' && draggingSpent[item.id] !== undefined) {
                                                                    await updateDoc(doc(db, 'marketing_campaigns', item.id), { spent: draggingSpent[item.id] });
                                                                }
                                                            }}
                                                            onTouchEnd={async () => {
                                                                if (userRole !== 'back_office' && draggingSpent[item.id] !== undefined) {
                                                                    await updateDoc(doc(db, 'marketing_campaigns', item.id), { spent: draggingSpent[item.id] });
                                                                }
                                                            }}
                                                            className={`w-full accent-orange-500 h-1.5 bg-[#111] border border-vps-gray/20 rounded-lg appearance-none ${userRole === 'back_office' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                        />
                                                        <span className="text-xs text-vps-ivory/60 font-bold min-w-[32px] text-right">{percent}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase border ${item.status === 'Đang chạy' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : item.status === 'Hoàn thành' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{item.status}</span>
                                                </td>
                                                {userRole !== 'back_office' && (
                                                    <td className="p-5 flex justify-center gap-4 mt-2">
                                                        <button onClick={() => openModal(item)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                        {['founder', 'front_office'].includes(userRole) && (
                                                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card Layout cho Bảng Chiến dịch */}
                    <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                        {filtered.length === 0 ? <div className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu.</div> :
                            filtered.map(item => {
                                const cpl = item.leads > 0 ? Math.round(item.spent / item.leads) : 0;
                                const currentSpentMobile = draggingSpent[item.id] !== undefined ? draggingSpent[item.id] : (item.spent || 0);
                                const percentMobile = item.budget ? Math.min(Math.round((currentSpentMobile / item.budget) * 100), 100) : 0;

                                return (
                                    <div key={item.id} className="p-5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-vps-gold text-lg">{item.name}</div>
                                                <span className="inline-block mt-1 bg-[#2A2A2A] px-2 py-0.5 rounded text-[10px] text-vps-ivory/80">{item.platform}</span>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${item.status === 'Đang chạy' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : item.status === 'Hoàn thành' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{item.status}</span>
                                        </div>
                                        <div className="text-sm text-vps-ivory/80 grid grid-cols-2 gap-2 bg-[#222] p-3 rounded-xl border border-vps-gray/10">
                                            <div><span className="text-gray-500 text-xs">Leads:</span> <strong className="text-vps-gold block">{item.leads || 0}</strong></div>
                                            <div><span className="text-gray-500 text-xs">CPL:</span> <strong className="text-orange-400 block">{formatCurrency(cpl)}</strong></div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-[11px] mb-2 font-medium">
                                                <span className="text-orange-400">Đã tiêu: {formatCurrency(currentSpentMobile)}</span>
                                                <span className="text-gray-500">Hạn mức: {formatCurrency(item.budget)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={item.budget || 0}
                                                    value={currentSpentMobile}
                                                    disabled={userRole === 'back_office'}
                                                    onChange={(e) => setDraggingSpent({ ...draggingSpent, [item.id]: parseInt(e.target.value, 10) || 0 })}
                                                    onMouseUp={async () => {
                                                        if (userRole !== 'back_office' && draggingSpent[item.id] !== undefined) {
                                                            await updateDoc(doc(db, 'marketing_campaigns', item.id), { spent: draggingSpent[item.id] });
                                                        }
                                                    }}
                                                    onTouchEnd={async () => {
                                                        if (userRole !== 'back_office' && draggingSpent[item.id] !== undefined) {
                                                            await updateDoc(doc(db, 'marketing_campaigns', item.id), { spent: draggingSpent[item.id] });
                                                        }
                                                    }}
                                                    className={`w-full accent-orange-500 h-1.5 bg-[#111] border border-vps-gray/20 rounded-lg appearance-none ${userRole === 'back_office' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                />
                                                <span className="text-xs text-vps-ivory/60 font-bold min-w-[32px] text-right">{percentMobile}%</span>
                                            </div>
                                        </div>

                                        {userRole !== 'back_office' && (
                                            <div className="flex justify-end gap-3 mt-1 pt-3">
                                                <button onClick={() => openModal(item)} className="px-3 py-1.5 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                                {['founder', 'front_office'].includes(userRole) && (
                                                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>

                {/* --- CỘT PHẢI: BRAND GUIDELINES (NÂNG CẤP MAX LEVEL INTERACTIVE) --- */}
                <div className="xl:col-span-1 bg-gradient-to-b from-[#1A1A1A] to-[#121212] border border-vps-gold/30 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.08)] p-6 flex flex-col h-fit relative overflow-hidden group">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-vps-gold/10 rounded-full blur-[80px] group-hover:bg-vps-gold/20 transition-all duration-1000 pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none"></div>

                    {/* Header Brand Guideline */}
                    <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-vps-gold/20 to-orange-500/10 rounded-xl border border-vps-gold/40 shadow-inner">
                                <Star className="w-6 h-6 text-vps-gold fill-vps-gold/30" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold bg-gradient-to-r from-vps-gold via-yellow-400 to-orange-400 bg-clip-text text-transparent">Brand Identity</h3>
                                <p className="text-[10px] text-vps-ivory/50 uppercase tracking-[0.2em] mt-1 font-semibold">Vị Phù Sa Official</p>
                            </div>
                        </div>
                        <button className="text-xs bg-[#222] hover:bg-vps-gold/10 hover:text-vps-gold text-gray-400 border border-vps-gray/20 px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm group/btn">
                            <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" /> Tải Kit
                        </button>
                    </div>

                    {/* Mini Tabs Navigation */}
                    <div className="flex p-1 bg-[#0a0a0a] rounded-xl mb-6 border border-vps-gray/20 relative z-10 shadow-inner">
                        <button onClick={() => setBrandTab('core')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${brandTab === 'core' ? 'bg-[#222] text-vps-gold shadow-sm border border-vps-gray/10' : 'text-gray-500 hover:text-vps-ivory'}`}>Cốt lõi</button>
                        <button onClick={() => setBrandTab('colors')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${brandTab === 'colors' ? 'bg-[#222] text-vps-gold shadow-sm border border-vps-gray/10' : 'text-gray-500 hover:text-vps-ivory'}`}>Thị giác</button>
                        <button onClick={() => setBrandTab('voice')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${brandTab === 'voice' ? 'bg-[#222] text-vps-gold shadow-sm border border-vps-gray/10' : 'text-gray-500 hover:text-vps-ivory'}`}>Giọng văn</button>
                    </div>

                    {/* Nội dung tương ứng với Tabs */}
                    <div className="relative z-10 min-h-[280px]">

                        {/* Tab 1: Cốt lõi (Core Identity) */}
                        {brandTab === 'core' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Slogan & Tầm nhìn</h4>
                                    <div className="bg-[#222]/60 border border-vps-gray/10 p-5 rounded-xl hover:border-vps-gold/30 transition-colors">
                                        <p className="text-lg font-serif italic text-vps-gold mb-3 text-center">"Ngọt vị phù sa - Đậm đà bản sắc"</p>
                                        <p className="text-xs text-gray-400 leading-relaxed text-justify">
                                            Mang đến sản phẩm nông sản sạch, tinh túy từ vùng đất phù sa màu mỡ. Chúng tôi tôn vinh giá trị lao động của người nông dân và cam kết bảo tồn hương vị truyền thống quê hương.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Giá trị Đại diện (Keywords)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Chân thành</span>
                                        <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Mộc mạc</span>
                                        <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Minh bạch</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Thị giác (Visuals - Colors & Fonts) */}
                        {brandTab === 'colors' && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between items-center">
                                        <span>Bảng màu (Click để Copy)</span>
                                        {copiedColor && <span className="text-green-400 flex items-center gap-1 text-[10px]"><Check className="w-3 h-3" /> Đã Copy!</span>}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { name: 'Cam Đất', hex: '#D97736', text: 'Màu nhấn, CTA' },
                                            { name: 'Xanh Lá Mạ', hex: '#4A7C59', text: 'Niềm tin, Nông sản' },
                                            { name: 'Vàng Lúa', hex: '#F2E8CF', text: 'Màu nền, Phụ trợ' },
                                            { name: 'Đen Xám', hex: '#383531', text: 'Màu chữ chính' }
                                        ].map((color) => (
                                            <div
                                                key={color.hex}
                                                onClick={() => handleCopyHex(color.hex)}
                                                className="bg-[#222]/50 border border-vps-gray/10 p-3 rounded-xl flex items-center gap-3 hover:bg-[#2a2a2a] hover:border-vps-gray/30 transition-all cursor-pointer group"
                                            >
                                                <div className="w-10 h-10 rounded-lg shadow-sm shrink-0 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" style={{ backgroundColor: color.hex, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-xs font-bold text-vps-ivory truncate">{color.name}</div>
                                                    <div className="text-[10px] text-vps-gold font-mono mt-0.5">{color.hex}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Typography (Phông chữ)</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-[#222]/50 border border-vps-gray/10 p-3 rounded-xl">
                                            <div className="text-2xl font-serif text-vps-ivory mb-1">Aa</div>
                                            <div className="text-xs font-bold text-vps-gold">Playfair Display</div>
                                            <div className="text-[10px] text-gray-500 mt-1">Dành cho Tiêu đề lớn</div>
                                        </div>
                                        <div className="bg-[#222]/50 border border-vps-gray/10 p-3 rounded-xl">
                                            <div className="text-2xl font-sans text-vps-ivory mb-1">Aa</div>
                                            <div className="text-xs font-bold text-blue-400">Inter / Roboto</div>
                                            <div className="text-[10px] text-gray-500 mt-1">Dành cho Văn bản, UI</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Giọng văn (Voice & Tone Guidelines) */}
                        {brandTab === 'voice' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Cách giao tiếp với khách hàng</h4>
                                    <ul className="space-y-3">
                                        <li className="bg-[#222]/60 p-3 rounded-xl border border-green-500/10">
                                            <div className="flex items-center gap-2 text-green-400 font-bold text-xs mb-1">
                                                <CheckCircle2 className="w-4 h-4" /> DO (Nên làm)
                                            </div>
                                            <p className="text-xs text-gray-400 leading-relaxed pl-6">Sử dụng ngôn ngữ mộc mạc, xưng hô gần gũi ("nhà Vị Phù Sa", "cô/chú/anh/chị"). Kể chuyện thật về quá trình sản xuất.</p>
                                        </li>
                                        <li className="bg-[#222]/60 p-3 rounded-xl border border-red-500/10">
                                            <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-1">
                                                <XCircle className="w-4 h-4" /> DON'T (Không nên)
                                            </div>
                                            <p className="text-xs text-gray-400 leading-relaxed pl-6">Tránh dùng từ ngữ đao to búa lớn, hứa hẹn quá mức hoặc dùng từ tiếng Anh chuyên ngành marketing khi tư vấn cho khách.</p>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quy tắc Hình ảnh</h4>
                                    <div className="bg-[#222]/50 p-3.5 rounded-xl border border-vps-gray/10 text-xs text-gray-400 flex items-start gap-3">
                                        <ImageIcon className="w-5 h-5 text-orange-400 shrink-0" />
                                        <p className="leading-relaxed">Luôn ưu tiên ánh sáng tự nhiên. Hình ảnh sản phẩm phải đi kèm bối cảnh thiên nhiên hoặc người lao động. <strong>Không ghép viền quá chói</strong> hoặc bóp méo Logo.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    };

    const renderCustomers = () => {
        const filtered = customers.filter(c => {
            const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.phone || '').includes(searchTerm);
            return matchSearch;
        });

        return (
            <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden mb-10 animate-fadeIn">
                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                <th className="p-5 font-semibold">Khách hàng / Liên hệ</th>
                                <th className="p-5 font-semibold">Chi tiết Hợp đồng</th>
                                <th className="p-5 font-semibold text-center">Trạng thái Phễu</th>
                                {userRole !== 'back_office' && <th className="p-5 font-semibold text-center">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/10">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={userRole !== 'back_office' ? "4" : "3"} className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu khách hàng.</td></tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-[#222] transition-colors group">
                                        <td className="p-5">
                                            <div className="font-bold text-vps-ivory text-sm group-hover:text-blue-400 transition-colors">{item.name}</div>
                                            <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                                                <MessageCircle className="w-3.5 h-3.5" /> {item.phone || 'Chưa có SĐT'}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-purple-400 text-sm">{formatCurrency(item.dealValue)}</div>
                                            <span className="inline-block mt-2 bg-[#2A2A2A] px-2 py-0.5 rounded text-[10px] text-vps-ivory/80 font-medium tracking-wide">
                                                Nguồn: {item.source || '--'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase border 
                                                ${item.pipeline === 'Đã chốt' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    item.pipeline === 'Đang tư vấn' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        item.pipeline === 'Thất bại' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                                {item.pipeline}
                                            </span>
                                        </td>
                                        {userRole !== 'back_office' && (
                                            <td className="p-5 flex justify-center gap-4">
                                                <button onClick={() => openModal(item)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                {['founder', 'front_office'].includes(userRole) && (
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout cho CRM */}
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                    {filtered.length === 0 ? <div className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu.</div> :
                        filtered.map(item => (
                            <div key={item.id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-vps-ivory text-lg">{item.name}</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> {item.phone || '--'}</div>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border 
                                        ${item.pipeline === 'Đã chốt' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            item.pipeline === 'Đang tư vấn' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                item.pipeline === 'Thất bại' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                        {item.pipeline}
                                    </span>
                                </div>
                                <div className="bg-[#222] p-3 rounded-xl border border-vps-gray/10 flex justify-between items-center">
                                    <div>
                                        <span className="text-gray-500 text-xs block mb-1">Giá trị HĐ:</span>
                                        <strong className="text-purple-400 block">{formatCurrency(item.dealValue)}</strong>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 text-xs block mb-1">Nguồn:</span>
                                        <strong className="text-vps-ivory/80 text-sm block">{item.source || '--'}</strong>
                                    </div>
                                </div>
                                {item.notes && <div className="text-xs text-gray-400 italic line-clamp-2 bg-[#111] p-2.5 rounded-lg border border-vps-gray/5">Ghi chú: {item.notes}</div>}

                                {userRole !== 'back_office' && (
                                    <div className="flex justify-end gap-3 mt-1">
                                        <button onClick={() => openModal(item)} className="px-3 py-1.5 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                        {['founder', 'front_office'].includes(userRole) && (
                                            <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    };

    const renderCompetitors = () => {
        const filtered = competitors.filter(c =>
            (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden mb-10 animate-fadeIn">
                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                <th className="p-5 font-semibold">Tên Đối thủ</th>
                                <th className="p-5 font-semibold">Mức giá Cạnh tranh</th> {/* CẬP NHẬT TÊN CỘT */}
                                <th className="p-5 font-semibold w-1/3">Kế hoạch Đối phó (Action Plan)</th>
                                {userRole !== 'back_office' && <th className="p-5 font-semibold text-center">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/10">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={userRole !== 'back_office' ? "4" : "3"} className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu đối thủ.</td></tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-[#222] transition-colors group">
                                        <td className="p-5">
                                            <div className="font-bold text-vps-gold text-sm group-hover:text-yellow-400 transition-colors">{item.name}</div>
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                                                    ${item.threatLevel === 'Cao' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        item.threatLevel === 'Trung bình' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                            'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                                    Mức đe dọa: {item.threatLevel}
                                                </span>
                                            </div>
                                        </td>
                                        {/* CẬP NHẬT HIỂN THỊ TIỀN TỆ */}
                                        <td className="p-5 text-sm text-vps-ivory/80 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-purple-400" />
                                                <span className="font-bold text-purple-400">{formatCurrency(item.pricing)}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-xs text-gray-400 leading-relaxed">
                                            <div className="line-clamp-2" title={item.actionPlan}>{item.actionPlan || 'Chưa cập nhật chiến lược đối phó.'}</div>
                                        </td>
                                        {userRole !== 'back_office' && (
                                            <td className="p-5 flex justify-center gap-4">
                                                <button onClick={() => openModal(item)} className="p-2 bg-vps-gold/10 hover:bg-vps-gold/20 text-vps-gold rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                                {['founder', 'front_office'].includes(userRole) && (
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout cho Đối thủ */}
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                    {filtered.length === 0 ? <div className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu.</div> :
                        filtered.map(item => (
                            <div key={item.id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-vps-gold text-lg">{item.name}</div>
                                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border 
                                        ${item.threatLevel === 'Cao' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            item.threatLevel === 'Trung bình' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                        Nguy cơ: {item.threatLevel}
                                    </span>
                                </div>

                                {/* CẬP NHẬT GIAO DIỆN MỨC GIÁ MOBILE */}
                                <div className="bg-[#222] p-3 rounded-xl border border-vps-gray/10 text-sm flex items-center justify-between">
                                    <span className="text-gray-500 text-xs">Mức giá:</span>
                                    <strong className="text-purple-400 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-purple-400" /> {formatCurrency(item.pricing)}</strong>
                                </div>

                                <div>
                                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1.5 block">Kế hoạch đối phó</span>
                                    <p className="text-xs text-gray-400 bg-[#111] p-3 rounded-lg border border-vps-gray/5 leading-relaxed">
                                        {item.actionPlan || 'Chưa cập nhật chiến lược.'}
                                    </p>
                                </div>

                                {userRole !== 'back_office' && (
                                    <div className="flex justify-end gap-3 mt-1">
                                        <button onClick={() => openModal(item)} className="px-3 py-1.5 bg-vps-gold/10 text-vps-gold rounded-lg text-xs font-bold flex items-center gap-1.5"><Edit className="w-3 h-3" /> Sửa</button>
                                        {['founder', 'front_office'].includes(userRole) && (
                                            <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3 h-3" /> Xóa</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    };

    return (
        <AppShell title="CRM & Marketing" subtitle="Theo dõi chiến dịch và khách hàng">
            <div className="transition-all duration-300 relative z-10 overflow-y-auto">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-vps-gold tracking-wide">Quản lý Marketing & CRM</h1>
                        <p className="text-vps-ivory/60 text-sm mt-1">Theo dõi số liệu chiến dịch, tỷ lệ chốt sales và đối thủ cạnh tranh.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'campaigns' ? 'bg-vps-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-[#222] text-vps-ivory/70 hover:bg-[#333]'}`}>
                            Chiến dịch
                        </button>
                        <button onClick={() => setActiveTab('customers')} className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'customers' ? 'bg-vps-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-[#222] text-vps-ivory/70 hover:bg-[#333]'}`}>
                            Phễu CRM
                        </button>
                        <button onClick={() => setActiveTab('competitors')} className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'competitors' ? 'bg-vps-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-[#222] text-vps-ivory/70 hover:bg-[#333]'}`}>
                            Đối thủ
                        </button>

                        {userRole !== 'back_office' && (
                            <button onClick={() => openModal()} className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap ml-auto md:ml-2 transition-colors">
                                <Plus className="w-4 h-4" /> Thêm mới
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dữ liệu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl py-3 pl-12 pr-4 text-sm text-vps-ivory focus:border-vps-gold outline-none transition-colors"
                        />
                    </div>
                </div>

                {renderAnalytics()}
                {activeTab === 'campaigns' && renderCampaigns()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'competitors' && renderCompetitors()}

            </div>

            {/* MODAL (Popup Form) */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-vps-gray/20 p-6 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold flex items-center gap-3">
                                    {activeTab === 'campaigns' && <Megaphone className="w-5 h-5" />}
                                    {activeTab === 'customers' && <Briefcase className="w-5 h-5" />}
                                    {activeTab === 'competitors' && <ShieldAlert className="w-5 h-5" />}
                                    {editingId ? 'Cập nhật Hệ thống' : 'Khởi tạo Dữ liệu'}
                                </h2>
                                <button type="button" onClick={closeModal} className="text-vps-ivory/60 hover:text-white bg-[#222] p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-7 space-y-6">
                                {/* Form Chiến dịch - GIỮ NGUYÊN */}
                                {activeTab === 'campaigns' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Tên chiến dịch *</label><input required className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Tên nhận diện chiến dịch..." /></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Nền tảng</label><input className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.platform || ''} onChange={e => setFormData({ ...formData, platform: e.target.value })} placeholder="Facebook, Google..." /></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Trạng thái</label><select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })}><option>Đang chạy</option><option>Hoàn thành</option><option>Tạm dừng</option></select></div>
                                            <div>
                                                <label className="text-xs font-bold text-green-400 mb-2 block uppercase tracking-wider">Ngân sách (VNĐ) *</label>
                                                <input type="text" required className="w-full bg-green-500/5 border border-green-500/20 rounded-xl p-3.5 text-green-400 font-bold focus:border-green-500 outline-none transition-colors" value={formData.budget || ''} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                                                {formData.budget && <p className="text-[10px] text-gray-500 mt-1.5 italic">{formatCurrency(formData.budget)}</p>}
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-orange-400 mb-2 block uppercase tracking-wider">Đã giải ngân (VNĐ)</label>
                                                <input type="text" className="w-full bg-orange-500/5 border border-orange-500/20 rounded-xl p-3.5 text-orange-400 font-bold focus:border-orange-500 outline-none transition-colors" value={formData.spent || ''} onChange={e => setFormData({ ...formData, spent: e.target.value })} />
                                                {formData.spent && <p className="text-[10px] text-gray-500 mt-1.5 italic">{formatCurrency(formData.spent)}</p>}
                                            </div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-purple-400 mb-2 block uppercase tracking-wider">Số Leads thu về (Chuyển đổi)</label><input type="number" className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl p-3.5 text-purple-400 font-bold focus:border-purple-500 outline-none transition-colors" value={formData.leads || ''} onChange={e => setFormData({ ...formData, leads: e.target.value })} placeholder="Số lượng Lead..." /></div>
                                        </div>
                                    </>
                                )}

                                {/* Form CRM - GIỮ NGUYÊN */}
                                {activeTab === 'customers' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Khách hàng / Doanh nghiệp *</label><input required className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">SĐT liên hệ</label><input type="tel" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                            <div>
                                                <label className="text-xs font-bold text-purple-400 mb-2 block uppercase tracking-wider">Giá trị Hợp đồng (VNĐ)</label>
                                                <input type="text" className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl p-3.5 text-purple-400 font-bold focus:border-purple-500 outline-none transition-colors" value={formData.dealValue || ''} onChange={e => setFormData({ ...formData, dealValue: e.target.value })} placeholder="Vd: 20000000" />
                                                {formData.dealValue && <p className="text-[10px] text-gray-500 mt-1.5 italic">{formatCurrency(formData.dealValue)}</p>}
                                            </div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Trạng thái Phễu</label><select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none font-bold text-blue-400 transition-colors" value={formData.pipeline || ''} onChange={e => setFormData({ ...formData, pipeline: e.target.value })}><option>Khách mới</option><option>Đang tư vấn</option><option>Đã chốt</option><option>Thất bại</option></select></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Nguồn (Source)</label><input type="text" className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.source || ''} onChange={e => setFormData({ ...formData, source: e.target.value })} /></div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Ghi chú đàm phán</label><textarea className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none resize-none transition-colors" rows="4" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Cập nhật tiến độ đàm phán, yêu cầu của khách..." /></div>
                                        </div>
                                    </>
                                )}

                                {/* CẬP NHẬT: Form Đối thủ (Dùng field Pricing nhập tay số tiền) */}
                                {activeTab === 'competitors' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Tên Đối thủ / Agency *</label><input required className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Vd: XYZ Media..." /></div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Mức độ đe dọa</label>
                                                <select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors" value={formData.threatLevel || ''} onChange={e => setFormData({ ...formData, threatLevel: e.target.value })}>
                                                    <option>Thấp</option><option>Trung bình</option><option>Cao</option>
                                                </select>
                                            </div>
                                            {/* CẬP NHẬT TRƯỜNG NHẬP MỨC GIÁ */}
                                            <div>
                                                <label className="text-xs font-bold text-purple-400 mb-2 block uppercase tracking-wider">Mức giá Cạnh tranh (VNĐ)</label>
                                                <input type="text" className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl p-3.5 text-purple-400 font-bold focus:border-purple-500 outline-none transition-colors" value={formData.pricing || ''} onChange={e => setFormData({ ...formData, pricing: e.target.value })} placeholder="Vd: 1500000" />
                                                {formData.pricing && <p className="text-[10px] text-gray-500 mt-1.5 italic">{formatCurrency(formData.pricing)}</p>}
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-green-400 mb-2 block uppercase tracking-wider">Điểm mạnh (Strengths)</label>
                                                <div className="quill-dark-theme bg-[#111] rounded-xl border border-vps-gray/20">
                                                    <ReactQuill theme="snow" modules={quillModules} value={formData.strength || ''} onChange={val => setFormData({ ...formData, strength: val })} placeholder="Ghi chú ưu thế của đối thủ..." />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-red-400 mb-2 block uppercase tracking-wider">Điểm yếu (Weaknesses)</label>
                                                <div className="quill-dark-theme bg-[#111] rounded-xl border border-vps-gray/20 mt-1">
                                                    <ReactQuill theme="snow" modules={quillModules} value={formData.weakness || ''} onChange={val => setFormData({ ...formData, weakness: val })} placeholder="Hạn chế mà ta có thể khai thác..." />
                                                </div>
                                            </div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-blue-400 mb-2 block uppercase tracking-wider">Kế hoạch đối phó (Action Plan)</label><textarea className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-blue-400 outline-none resize-none transition-colors" rows="3" value={formData.actionPlan || ''} onChange={e => setFormData({ ...formData, actionPlan: e.target.value })} placeholder="Chiến lược cạnh tranh..." /></div>
                                        </div>
                                    </>
                                )}

                                <div className="pt-8 border-t border-vps-gray/20 flex gap-4">
                                    <button type="button" onClick={closeModal} className="w-1/3 px-4 py-4 bg-[#222] border border-vps-gray/20 text-vps-ivory rounded-xl font-bold hover:bg-[#333] transition-colors">Hủy bỏ</button>
                                    <button type="submit" className="w-2/3 px-4 py-4 bg-vps-gold text-vps-black rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(212,175,55,0.3)]"><Save className="w-5 h-5" />Lưu Dữ liệu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </AppShell>
    );
};

export default Marketing;