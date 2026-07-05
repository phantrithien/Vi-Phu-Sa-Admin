import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Plus, Search, Edit, Trash2, Cloud,
    Megaphone, Target, ShieldAlert,
    Star, MessageCircle, X, Save,
    Users, DollarSign, Activity, PieChart, Briefcase,
    Zap, Award, BarChart3, Crosshair, Filter
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
            if (activeTab === 'competitors') setFormData({ name: '', threatLevel: 'Trung bình', pricing: 'Tầm trung', equipment: '', strength: '', weakness: '', actionPlan: '' });
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
                        {/* Thẻ 1 */}
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
                        {/* Thẻ 2 */}
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
                        {/* Thẻ 3 */}
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
                        {/* Thẻ 4 */}
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

            const pipelineData = {
                labels: ['Khách mới', 'Đang tư vấn', 'Đã chốt', 'Thất bại'],
                datasets: [{
                    data: [
                        customers.filter(c => c.pipeline === 'Khách mới').length,
                        customers.filter(c => c.pipeline === 'Đang tư vấn').length,
                        won,
                        customers.filter(c => c.pipeline === 'Thất bại').length
                    ],
                    backgroundColor: ['rgba(156, 163, 175, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                    borderWidth: 0
                }]
            };

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Tổng Leads trong Phễu</p><h3 className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight">{customers.length}</h3></div>
                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"><Users className="w-6 h-6 text-blue-400" /></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-green-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Hợp đồng Đã chốt</p><h3 className="text-2xl md:text-3xl font-bold text-green-400 tracking-tight">{won}</h3></div>
                                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20"><Target className="w-6 h-6 text-green-400" /></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Doanh thu Dự kiến</p><h3 className="text-xl md:text-2xl font-bold text-purple-400 tracking-tight truncate">{formatCurrency(expectedValue)}</h3></div>
                                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20"><BarChart3 className="w-6 h-6 text-purple-400" /></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-yellow-500/30 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Doanh thu Thực Tế</p><h3 className="text-xl md:text-2xl font-bold text-vps-gold tracking-tight truncate">{formatCurrency(wonValue)}</h3></div>
                                <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><Award className="w-6 h-6 text-vps-gold" /></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                        <div className="lg:col-span-1 bg-[#1A1A1A] border border-vps-gray/20 p-7 rounded-2xl shadow-xl flex flex-col items-center justify-center">
                            <h3 className="font-bold text-lg text-vps-ivory mb-6 tracking-wide w-full text-left">Phân bổ Phễu</h3>
                            <div className="relative w-48 h-48"><Doughnut data={pipelineData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#888', padding: 20 } } }, cutout: '75%' }} /></div>
                        </div>
                        <div className="lg:col-span-2 bg-[#1A1A1A] border border-vps-gray/20 p-7 rounded-2xl shadow-xl flex flex-col justify-center">
                            <h3 className="font-bold text-lg text-vps-ivory mb-8 tracking-wide">Hiệu suất Chuyển đổi Toàn hệ thống</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm font-medium text-gray-400 mb-2"><span>Khách Mới → Đang Tư Vấn</span><span className="text-blue-400">Tích cực</span></div>
                                    <div className="w-full bg-[#111] h-3 rounded-full overflow-hidden border border-vps-gray/20"><div className="bg-blue-500 h-full rounded-full w-[80%]"></div></div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm font-medium text-gray-400 mb-2"><span>Đang Tư Vấn → Đã Chốt (Tỉ lệ chốt đơn)</span><span className="text-vps-gold font-bold">{getCRMStats().conversionRate}%</span></div>
                                    <div className="w-full bg-[#111] h-3 rounded-full overflow-hidden border border-vps-gray/20"><div className="bg-gradient-to-r from-yellow-600 to-vps-gold h-full rounded-full transition-all duration-1000" style={{ width: `${getCRMStats().conversionRate}%` }}></div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (activeTab === 'competitors') {
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
                    <div className="bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-vps-gray/20 p-6 rounded-2xl shadow-xl hover:-translate-y-1 hover:border-yellow-500/30 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div><p className="text-xs font-semibold text-vps-ivory/60 uppercase tracking-wider mb-2">Phân khúc Cao cấp</p><h3 className="text-2xl md:text-3xl font-bold text-vps-gold tracking-tight">{competitors.filter(c => c.pricing === 'Cao cấp').length}</h3></div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20"><DollarSign className="w-6 h-6 text-vps-gold" /></div>
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

    const getCRMStats = () => {
        const wonValue = customers.filter(c => c.pipeline === 'Đã chốt').reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
        const conversionRate = customers.length > 0 ? Math.round((customers.filter(c => c.pipeline === 'Đã chốt').length / customers.length) * 100) : 0;
        return { wonValue, conversionRate };
    };

    const renderCampaigns = () => {
        const filtered = campaigns.filter(c => {
            const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterOption === 'All' || c.status === filterOption;
            return matchSearch && matchFilter;
        });

        return (
            <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden animate-fadeIn mb-10">
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
        );
    };

    const renderCustomers = () => {
        const filtered = customers.filter(c => {
            const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterOption === 'All' || c.pipeline === filterOption;
            return matchSearch && matchFilter;
        });
        return (
            <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden animate-fadeIn mb-10">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                <th className="p-5 font-semibold">Khách Hàng / Đầu mối</th>
                                <th className="p-5 font-semibold">Giá trị HĐ (Deal Size)</th>
                                <th className="p-5 font-semibold">Nguồn & Phễu</th>
                                <th className="p-5 font-semibold">Tương tác CSKH</th>
                                {userRole !== 'back_office' && <th className="p-5 font-semibold text-center">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/10">
                            {filtered.length === 0 ? <tr><td colSpan={userRole !== 'back_office' ? "5" : "4"} className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu.</td></tr> :
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-[#222] transition-colors group">
                                        <td className="p-5 text-sm">
                                            <div className="font-bold text-vps-ivory flex items-center gap-2 text-base group-hover:text-white transition-colors">
                                                {item.name} {item.priority === 'VIP' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1.5">{item.phone}</div>
                                            <div className="text-yellow-400 text-[10px] tracking-widest mt-1.5">{'★'.repeat(Number(item.rating || 0))}</div>
                                        </td>
                                        <td className="p-5 text-base font-bold text-purple-400">
                                            {formatCurrency(item.dealValue)}
                                        </td>
                                        <td className="p-5">
                                            <div className="text-[11px] text-gray-500 mb-2 font-medium">Nguồn: <span className="text-vps-ivory">{item.source || 'Khác'}</span></div>
                                            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${item.pipeline === 'Đã chốt' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                item.pipeline === 'Thất bại' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                    item.pipeline === 'Đang tư vấn' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                                }`}>{item.pipeline || 'Khách mới'}</span>
                                        </td>
                                        <td className="p-5 text-sm text-vps-ivory/80">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-vps-gold/80 mb-2"><MessageCircle className="w-3.5 h-3.5" /> {item.lastContact || 'Chưa liên hệ'}</div>
                                            <div className="text-xs text-gray-400 line-clamp-2 italic bg-[#222] border border-vps-gray/10 p-2 rounded-lg">"{item.notes || 'Không có ghi chú'}"</div>
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
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                    {filtered.length === 0 ? <div className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu.</div> :
                        filtered.map(item => (
                            <div key={item.id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-vps-ivory flex items-center gap-2 text-lg">
                                            {item.name} {item.priority === 'VIP' && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">{item.phone}</div>
                                    </div>
                                    <span className={`inline-block text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${item.pipeline === 'Đã chốt' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                        item.pipeline === 'Thất bại' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                            item.pipeline === 'Đang tư vấn' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                        }`}>{item.pipeline || 'Khách mới'}</span>
                                </div>
                                <div className="text-lg font-bold text-purple-400 bg-purple-500/5 p-3 rounded-xl border border-purple-500/10 text-center">Deal: {formatCurrency(item.dealValue)}</div>
                                <div className="text-sm text-gray-400 bg-[#222] p-3 rounded-xl border border-vps-gray/10 line-clamp-2 italic">"{item.notes || 'Không có ghi chú'}"</div>
                                {userRole !== 'back_office' && (
                                    <div className="flex justify-end gap-3 mt-1 pt-3">
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
    }

    const renderCompetitors = () => {
        const filtered = competitors.filter(c => {
            const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterOption === 'All' || c.threatLevel === filterOption;
            return matchSearch && matchFilter;
        });
        return (
            <div className="bg-[#1A1A1A] border border-vps-gray/20 rounded-2xl shadow-xl overflow-hidden animate-fadeIn mb-10">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1E1E1E] border-b border-vps-gray/20 text-vps-ivory/60 text-xs uppercase tracking-wider">
                                <th className="p-5 font-semibold">Tên Đối Thủ / Agency</th>
                                <th className="p-5 font-semibold">Mức độ đe dọa</th>
                                <th className="p-5 font-semibold">Phân khúc giá</th>
                                <th className="p-5 font-semibold">Đánh giá chung (SWOT)</th>
                                {userRole !== 'back_office' && <th className="p-5 font-semibold text-center">Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/10">
                            {filtered.length === 0 ? <tr><td colSpan={userRole !== 'back_office' ? "5" : "4"} className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu đối thủ.</td></tr> :
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-[#222] transition-colors group">
                                        <td className="p-5 font-bold text-vps-ivory text-base group-hover:text-white transition-colors">
                                            {item.name}
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${item.threatLevel === 'Cao' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                item.threatLevel === 'Trung bình' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                                    'bg-green-500/10 border-green-500/20 text-green-400'
                                                }`}>{item.threatLevel || 'Chưa rõ'}</span>
                                        </td>
                                        <td className="p-5 text-sm font-bold text-vps-gold">
                                            {item.pricing || 'Tầm trung'}
                                        </td>
                                        <td className="p-5 text-sm text-gray-400">
                                            <div className="flex flex-col gap-2 bg-[#222] p-3 rounded-lg border border-vps-gray/10">
                                                {item.strength && (
                                                    <div className="flex gap-2 items-start line-clamp-2">
                                                        <span className="text-green-400 font-bold mt-0.5">+</span>
                                                        <div dangerouslySetInnerHTML={{ __html: item.strength }} className="text-xs" />
                                                    </div>
                                                )}
                                                {item.weakness && (
                                                    <div className="flex gap-2 items-start line-clamp-2">
                                                        <span className="text-red-400 font-bold mt-0.5">-</span>
                                                        <div dangerouslySetInnerHTML={{ __html: item.weakness }} className="text-xs" />
                                                    </div>
                                                )}
                                            </div>
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
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/10">
                    {filtered.length === 0 ? <div className="p-8 text-center text-vps-ivory/40">Chưa có dữ liệu đối thủ.</div> :
                        filtered.map(item => (
                            <div key={item.id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-vps-ivory text-xl">{item.name}</div>
                                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${item.threatLevel === 'Cao' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        item.threatLevel === 'Trung bình' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                            'bg-green-500/10 border-green-500/20 text-green-400'
                                        }`}>{item.threatLevel || 'Chưa rõ'}</span>
                                </div>
                                <div className="text-sm font-bold text-vps-gold bg-vps-gold/5 border border-vps-gold/10 p-2 rounded-lg text-center">Phân khúc: {item.pricing || 'Tầm trung'}</div>
                                <div className="text-sm text-gray-400 bg-[#222] p-4 rounded-xl border border-vps-gray/10 flex flex-col gap-3">
                                    {item.strength && (
                                        <div className="flex gap-2 items-start">
                                            <span className="text-green-400 font-bold">+</span>
                                            <div dangerouslySetInnerHTML={{ __html: item.strength }} className="text-xs" />
                                        </div>
                                    )}
                                    {item.weakness && (
                                        <div className="flex gap-2 items-start">
                                            <span className="text-red-400 font-bold">-</span>
                                            <div dangerouslySetInnerHTML={{ __html: item.weakness }} className="text-xs" />
                                        </div>
                                    )}
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
                        ))
                    }
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex w-full max-w-[100vw] overflow-x-hidden relative text-vps-ivory">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-5 pt-24 md:p-10 md:pt-10 overflow-y-auto w-full">

                {/* Header Đồng bộ chuẩn Dashboard */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-vps-gold drop-shadow-md">Marketing & Sales</h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                                <Cloud className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Đã đồng bộ</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Hệ thống CRM & Đo lường Tỉ lệ chuyển đổi chuyên sâu.</p>
                    </div>
                    {['founder', 'front_office'].includes(userRole) && (
                        <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                            <Plus className="w-5 h-5" />
                            <span>{activeTab === 'campaigns' ? 'Khởi tạo Chiến Dịch' : activeTab === 'customers' ? 'Thêm Lead/Khách' : 'Thêm Đối Thủ'}</span>
                        </button>
                    )}
                </div>

                {/* Tab Navigation mượt mà */}
                <div className="flex overflow-x-auto gap-3 mb-10 custom-scrollbar pb-2">
                    <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'campaigns' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}><Megaphone className="w-5 h-5" /> Chiến Dịch Marketing</button>
                    <button onClick={() => setActiveTab('customers')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'customers' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}><Briefcase className="w-5 h-5" /> Pipeline Khách Hàng</button>
                    <button onClick={() => setActiveTab('competitors')} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'competitors' ? 'bg-vps-gold text-vps-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-[#1A1A1A] text-vps-ivory/60 border border-vps-gray/20 hover:text-vps-gold hover:border-vps-gold/30'}`}><PieChart className="w-5 h-5" /> Mạng lưới Đối Thủ</button>
                </div>

                {/* Phần Analytics Render */}
                {renderAnalytics()}

                {/* Vùng Lọc và Tiết Kiếm */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input type="text" placeholder={`Tìm kiếm dữ liệu...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1A1A1A] border border-vps-gray/20 rounded-xl pl-12 pr-4 py-3.5 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner transition-colors" />
                    </div>

                    <div className="relative min-w-[200px]">
                        <select
                            value={filterOption}
                            onChange={(e) => setFilterOption(e.target.value)}
                            className="w-full appearance-none h-full px-5 py-3.5 pr-10 bg-[#1A1A1A] border border-vps-gray/20 rounded-xl text-vps-ivory hover:border-vps-gold/50 focus:outline-none focus:border-vps-gold transition-colors cursor-pointer text-sm font-semibold"
                        >
                            <option value="All">Tất cả trạng thái</option>
                            {activeTab === 'campaigns' && (
                                <>
                                    <option value="Đang chạy">Đang chạy</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                </>
                            )}
                            {activeTab === 'customers' && (
                                <>
                                    <option value="Khách mới">Phễu: Khách mới</option>
                                    <option value="Đang tư vấn">Phễu: Đang tư vấn</option>
                                    <option value="Đã chốt">Phễu: Đã chốt</option>
                                    <option value="Thất bại">Phễu: Thất bại</option>
                                </>
                            )}
                            {activeTab === 'competitors' && (
                                <>
                                    <option value="Thấp">Đe dọa: Thấp</option>
                                    <option value="Trung bình">Đe dọa: Trung bình</option>
                                    <option value="Cao">Đe dọa: Cao</option>
                                </>
                            )}
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                {/* Danh sách Bảng Dữ Liệu */}
                {activeTab === 'campaigns' && renderCampaigns()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'competitors' && renderCompetitors()}

                {/* MODAL (Popup Form) */}
                {isModalOpen && (
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
                                {/* Form Chiến dịch */}
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

                                {/* Form CRM */}
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

                                {/* Form Đối thủ */}
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
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Phân khúc giá</label>
                                                <select className="w-full bg-[#111] border border-vps-gray/20 rounded-xl p-3.5 text-vps-ivory focus:border-vps-gold outline-none appearance-none transition-colors" value={formData.pricing || ''} onChange={e => setFormData({ ...formData, pricing: e.target.value })}>
                                                    <option>Giá rẻ</option><option>Tầm trung</option><option>Cao cấp</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-green-400 mb-2 block uppercase tracking-wider">Điểm mạnh (Strengths)</label>
                                                <div className="quill-dark-theme bg-[#111] rounded-xl border border-vps-gray/20">
                                                    <ReactQuill
                                                        theme="snow"
                                                        modules={quillModules}
                                                        value={formData.strength || ''}
                                                        onChange={val => setFormData({ ...formData, strength: val })}
                                                        placeholder="Ghi chú ưu thế của đối thủ..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-red-400 mb-2 block uppercase tracking-wider">Điểm yếu (Weaknesses)</label>
                                                <div className="quill-dark-theme bg-[#111] rounded-xl border border-vps-gray/20 mt-1">
                                                    <ReactQuill
                                                        theme="snow"
                                                        modules={quillModules}
                                                        value={formData.weakness || ''}
                                                        onChange={val => setFormData({ ...formData, weakness: val })}
                                                        placeholder="Hạn chế mà ta có thể khai thác..."
                                                    />
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
                )}
            </div>
        </div>
    );
};

export default Marketing;