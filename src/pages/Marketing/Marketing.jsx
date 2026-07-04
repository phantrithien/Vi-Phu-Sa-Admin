import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    Plus, Search, Edit, Trash2, Cloud,
    Megaphone, Target, HeartHandshake, ShieldAlert,
    Star, MessageCircle, X, Save, TrendingUp,
    Users, DollarSign, Activity, PieChart, Briefcase,
    Zap, Award, BarChart3, Crosshair, Filter,
    Building2, Smartphone
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Import Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Marketing = () => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [campaigns, setCampaigns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [competitors, setCompetitors] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});

    const formatCurrency = (value) => {
        const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, ''), 10) : value;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    useEffect(() => {
        const unsubCampaigns = onSnapshot(collection(db, 'marketing_campaigns'), (snap) => {
            setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

    // --- BIỂU ĐỒ & KPI ---
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fadeIn">
                    <div className="lg:col-span-1 grid grid-cols-2 gap-3 md:gap-4 content-start">
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-blue-400 mb-2"><Activity className="w-4 h-4" /> <span className="text-xs font-medium">Chiến dịch Active</span></div><p className="text-xl md:text-2xl font-bold text-vps-ivory">{campaigns.filter(c => c.status === 'Đang chạy').length}</p></div>
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-vps-gold mb-2"><Users className="w-4 h-4" /> <span className="text-xs font-medium">Tổng Leads thu về</span></div><p className="text-xl md:text-2xl font-bold text-vps-gold">{totalLeads}</p></div>
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-green-400 mb-2"><DollarSign className="w-4 h-4" /> <span className="text-xs font-medium">Ngân sách Tổng</span></div><p className="text-sm md:text-base font-bold text-green-400 truncate">{formatCurrency(totalBudget)}</p></div>
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-orange-400 mb-2"><Crosshair className="w-4 h-4" /> <span className="text-xs font-medium">Avg CPL (Giá/Lead)</span></div><p className="text-sm md:text-base font-bold text-orange-400 truncate">{formatCurrency(avgCPL)}</p></div>
                    </div>
                    <div className="lg:col-span-2 bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg h-64">
                        <h3 className="text-sm font-semibold text-vps-ivory mb-2">Top 5 Chiến dịch (Ngân sách vs Tiêu hao)</h3>
                        <div className="h-48"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#888' } } }, scales: { y: { ticks: { color: '#888' } }, x: { ticks: { color: '#888' } } } }} /></div>
                    </div>
                </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 animate-fadeIn">
                    <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4 content-start">
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-blue-400 mb-2"><Users className="w-4 h-4" /> <span className="text-xs font-medium">Tổng Leads trong Phễu</span></div><p className="text-xl md:text-2xl font-bold text-vps-ivory">{customers.length}</p></div>
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-green-400 mb-2"><Target className="w-4 h-4" /> <span className="text-xs font-medium">Hợp đồng Đã chốt</span></div><p className="text-xl md:text-2xl font-bold text-green-400">{won}</p></div>
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-purple-400 mb-2"><BarChart3 className="w-4 h-4" /> <span className="text-xs font-medium">Doanh thu Dự kiến (Pipeline)</span></div><p className="text-sm md:text-lg font-bold text-purple-400 truncate">{formatCurrency(expectedValue)}</p></div>
                        <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg"><div className="flex items-center gap-2 text-vps-gold mb-2"><Award className="w-4 h-4" /> <span className="text-xs font-medium">Doanh thu Thực Tế (Won)</span></div><p className="text-sm md:text-lg font-bold text-vps-gold truncate">{formatCurrency(wonValue)}</p></div>
                    </div>
                    <div className="lg:col-span-1 bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl shadow-lg h-64 flex flex-col">
                        <h3 className="text-sm font-semibold text-vps-ivory mb-2 text-center">Phân bổ Trạng thái Phễu</h3>
                        <div className="flex-1 relative w-full flex justify-center items-center"><div className="h-44 w-44"><Doughnut data={pipelineData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#888', boxWidth: 12, font: { size: 10 } } } } }} /></div></div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'competitors') {
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6 animate-fadeIn">
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl"><div className="flex items-center gap-2 text-blue-400 mb-2"><ShieldAlert className="w-4 h-4" /> <span className="text-xs font-medium">Đang theo dõi</span></div><p className="text-xl md:text-2xl font-bold text-vps-ivory">{competitors.length} <span className="text-sm font-normal text-gray-500">đối thủ</span></p></div>
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl"><div className="flex items-center gap-2 text-red-400 mb-2"><Activity className="w-4 h-4" /> <span className="text-xs font-medium">Đe dọa mức CAO</span></div><p className="text-xl md:text-2xl font-bold text-red-400">{competitors.filter(c => c.threatLevel === 'Cao').length}</p></div>
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl"><div className="flex items-center gap-2 text-vps-gold mb-2"><DollarSign className="w-4 h-4" /> <span className="text-xs font-medium">Phân khúc Cao cấp</span></div><p className="text-xl md:text-2xl font-bold text-vps-gold">{competitors.filter(c => c.pricing === 'Cao cấp').length}</p></div>
                    <div className="bg-[#1E1E1E] border border-vps-gray p-4 rounded-xl"><div className="flex items-center gap-2 text-green-400 mb-2"><Zap className="w-4 h-4" /> <span className="text-xs font-medium">Đồng bộ</span></div><p className="text-sm font-bold text-green-400 mt-2">Dữ liệu Real-time</p></div>
                </div>
            );
        }
    };

    const getCRMStats = () => {
        const totalPotential = customers.reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
        const wonValue = customers.filter(c => c.pipeline === 'Đã chốt').reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
        const conversionRate = customers.length > 0 ? Math.round((customers.filter(c => c.pipeline === 'Đã chốt').length / customers.length) * 100) : 0;

        return { totalPotential, wonValue, conversionRate };
    };

    // --- RENDER BẢNG DỮ LIỆU ---
    const renderCampaigns = () => {
        const filtered = campaigns.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                {/* Bản Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1A1A1A] border-b border-vps-gray text-vps-ivory/60 text-sm uppercase">
                                <th className="p-4 font-medium">Chiến Dịch & Nền tảng</th>
                                <th className="p-4 font-medium">Chỉ số Hiệu suất (KPI)</th>
                                <th className="p-4 font-medium w-48">Tiến độ Ngân sách</th>
                                <th className="p-4 font-medium text-center">Trạng Thái</th>
                                <th className="p-4 font-medium text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/40">
                            {filtered.length === 0 ? <tr><td colSpan="5" className="p-6 text-center text-vps-ivory/40">Chưa có dữ liệu.</td></tr> :
                                filtered.map(item => {
                                    const percent = item.budget ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
                                    const cpl = item.leads > 0 ? Math.round(item.spent / item.leads) : 0;
                                    return (
                                        <tr key={item.id} className="hover:bg-[#252525] transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-vps-gold text-sm">{item.name}</div>
                                                <span className="inline-block mt-1 bg-[#2A2A2A] px-2 py-0.5 rounded text-[10px] text-vps-ivory/80">{item.platform}</span>
                                                <div className="text-[10px] text-gray-500 mt-1">{item.startDate || '--'} đến {item.endDate || '--'}</div>
                                            </td>
                                            <td className="p-4 text-xs text-vps-ivory/80 space-y-1">
                                                <div className="flex gap-2"><span className="text-gray-400">Leads:</span> <span className="font-bold text-vps-gold">{item.leads || 0}</span></div>
                                                <div className="flex gap-2"><span className="text-gray-400">CPL:</span> <span className="text-orange-400">{formatCurrency(cpl)}/lead</span></div>
                                                {item.kpi && <div className="text-gray-500 italic truncate w-32" title={item.kpi}>Mục tiêu: {item.kpi}</div>}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-orange-400 font-medium">{formatCurrency(item.spent)}</span>
                                                    <span className="text-gray-500">{formatCurrency(item.budget)}</span>
                                                </div>
                                                <div className="w-full bg-vps-gray rounded-full h-1.5"><div className={`h-1.5 rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-green-400'}`} style={{ width: `${percent}%` }}></div></div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.status === 'Đang chạy' ? 'bg-blue-500/20 text-blue-400' : item.status === 'Hoàn thành' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{item.status}</span>
                                            </td>
                                            <td className="p-4 flex justify-center gap-3">
                                                <button onClick={() => openModal(item)} className="text-vps-gold hover:text-yellow-400"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>
                {/* Bản Mobile */}
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/40">
                    {filtered.length === 0 ? <div className="p-6 text-center text-vps-ivory/40">Chưa có dữ liệu.</div> :
                        filtered.map(item => {
                            const percent = item.budget ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
                            const cpl = item.leads > 0 ? Math.round(item.spent / item.leads) : 0;
                            return (
                                <div key={item.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-vps-gold">{item.name}</div>
                                            <span className="inline-block mt-1 bg-[#2A2A2A] px-2 py-0.5 rounded text-[10px] text-vps-ivory/80">{item.platform}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.status === 'Đang chạy' ? 'bg-blue-500/20 text-blue-400' : item.status === 'Hoàn thành' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{item.status}</span>
                                    </div>
                                    <div className="text-xs text-vps-ivory/80 grid grid-cols-2 gap-2">
                                        <div><span className="text-gray-400">Leads:</span> <strong className="text-vps-gold">{item.leads || 0}</strong></div>
                                        <div><span className="text-gray-400">CPL:</span> <strong className="text-orange-400">{formatCurrency(cpl)}</strong></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] mb-1">
                                            <span className="text-orange-400 font-medium">{formatCurrency(item.spent)}</span>
                                            <span className="text-gray-500">{formatCurrency(item.budget)}</span>
                                        </div>
                                        <div className="w-full bg-vps-gray rounded-full h-1.5"><div className={`h-1.5 rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-green-400'}`} style={{ width: `${percent}%` }}></div></div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-2 border-t border-vps-gray/30 pt-3">
                                        <button onClick={() => openModal(item)} className="flex items-center gap-1 text-xs text-vps-gold"><Edit className="w-3 h-3" /> Sửa</button>
                                        <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1 text-xs text-red-400"><Trash2 className="w-3 h-3" /> Xóa</button>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        );
    };

    const renderCustomers = () => {
        const filtered = customers.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                {/* Bản Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1A1A1A] border-b border-vps-gray text-vps-ivory/60 text-sm uppercase">
                                <th className="p-4 font-medium">Khách Hàng / Đầu mối</th>
                                <th className="p-4 font-medium">Giá trị HĐ (Deal Size)</th>
                                <th className="p-4 font-medium">Nguồn & Phễu</th>
                                <th className="p-4 font-medium">Tương tác CSKH</th>
                                <th className="p-4 font-medium text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/40">
                            {filtered.length === 0 ? <tr><td colSpan="5" className="p-6 text-center text-vps-ivory/40">Chưa có dữ liệu.</td></tr> :
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-[#252525] transition-colors">
                                        <td className="p-4 text-sm">
                                            <div className="font-bold text-vps-ivory flex items-center gap-2">
                                                {item.name} {item.priority === 'VIP' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{item.phone}</div>
                                            <div className="text-yellow-400 text-[10px] tracking-widest mt-1">{'★'.repeat(Number(item.rating || 0))}</div>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-purple-400">
                                            {formatCurrency(item.dealValue)}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-[10px] text-gray-400 mb-1">Nguồn: <span className="text-vps-ivory">{item.source || 'Khác'}</span></div>
                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${item.pipeline === 'Đã chốt' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                                                item.pipeline === 'Thất bại' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                                                    item.pipeline === 'Đang tư vấn' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' :
                                                        'bg-gray-500/10 border-gray-500/50 text-gray-300'
                                                }`}>{item.pipeline || 'Khách mới'}</span>
                                        </td>
                                        <td className="p-4 text-sm text-vps-ivory/80">
                                            <div className="flex items-center gap-1 text-[10px] text-vps-gold/80 mb-1"><MessageCircle className="w-3 h-3" /> {item.lastContact || 'Chưa LH'}</div>
                                            <div className="text-xs text-gray-400 line-clamp-2 italic bg-[#1A1A1A] p-1.5 rounded">"{item.notes || 'Không có ghi chú'}"</div>
                                        </td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button onClick={() => openModal(item)} className="text-vps-gold hover:text-yellow-400"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                {/* Bản Mobile */}
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/40">
                    {filtered.length === 0 ? <div className="p-6 text-center text-vps-ivory/40">Chưa có dữ liệu.</div> :
                        filtered.map(item => (
                            <div key={item.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-vps-ivory flex items-center gap-2">
                                            {item.name} {item.priority === 'VIP' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{item.phone}</div>
                                    </div>
                                    <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded border ${item.pipeline === 'Đã chốt' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                                        item.pipeline === 'Thất bại' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                                            item.pipeline === 'Đang tư vấn' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' :
                                                'bg-gray-500/10 border-gray-500/50 text-gray-300'
                                        }`}>{item.pipeline || 'Khách mới'}</span>
                                </div>
                                <div className="text-sm font-bold text-purple-400">Deal: {formatCurrency(item.dealValue)}</div>
                                <div className="text-xs text-gray-400 bg-[#1A1A1A] p-2 rounded line-clamp-2 italic">"{item.notes || 'Không có ghi chú'}"</div>
                                <div className="flex justify-end gap-3 mt-2 border-t border-vps-gray/30 pt-3">
                                    <button onClick={() => openModal(item)} className="flex items-center gap-1 text-xs text-vps-gold"><Edit className="w-3 h-3" /> Sửa</button>
                                    <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1 text-xs text-red-400"><Trash2 className="w-3 h-3" /> Xóa</button>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Thống kê CRM (Chung cho cả Mobile & Desktop) */}
                <div className="p-4 md:p-6 border-t border-vps-gray">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#1A1A1A] p-4 rounded-xl border border-vps-gray">
                            <p className="text-gray-400 text-xs mb-1">Doanh thu tiềm năng (Pipeline)</p>
                            <p className="text-lg font-bold text-vps-gold">{formatCurrency(getCRMStats().totalPotential)}</p>
                        </div>
                        <div className="bg-[#1A1A1A] p-4 rounded-xl border border-vps-gray">
                            <p className="text-gray-400 text-xs mb-1">Doanh thu đã chốt (Won)</p>
                            <p className="text-lg font-bold text-green-400">{formatCurrency(getCRMStats().wonValue)}</p>
                        </div>
                        <div className="bg-[#1A1A1A] p-4 rounded-xl border border-vps-gray">
                            <p className="text-gray-400 text-xs mb-1">Tỉ lệ chuyển đổi toàn hệ thống</p>
                            <p className="text-lg font-bold text-blue-400">{getCRMStats().conversionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const renderCompetitors = () => {
        const filtered = competitors.filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="bg-[#1E1E1E] border border-vps-gray rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                {/* Bản Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1A1A1A] border-b border-vps-gray text-vps-ivory/60 text-sm uppercase">
                                <th className="p-4 font-medium">Tên Đối Thủ / Agency</th>
                                <th className="p-4 font-medium">Mức độ đe dọa</th>
                                <th className="p-4 font-medium">Phân khúc giá</th>
                                <th className="p-4 font-medium">Đánh giá chung (SWOT)</th>
                                <th className="p-4 font-medium text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vps-gray/40">
                            {filtered.length === 0 ? <tr><td colSpan="5" className="p-6 text-center text-vps-ivory/40">Chưa có dữ liệu đối thủ.</td></tr> :
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-[#252525] transition-colors">
                                        <td className="p-4 font-bold text-vps-ivory">
                                            {item.name}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${item.threatLevel === 'Cao' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                                                    item.threatLevel === 'Trung bình' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' :
                                                        'bg-green-500/10 border-green-500/50 text-green-400'
                                                }`}>{item.threatLevel || 'Chưa rõ'}</span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-vps-gold">
                                            {item.pricing || 'Tầm trung'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            <div className="flex flex-col gap-1">
                                                {item.strength && <div className="line-clamp-1"><span className="text-green-400 font-bold">+</span> {item.strength}</div>}
                                                {item.weakness && <div className="line-clamp-1"><span className="text-red-400 font-bold">-</span> {item.weakness}</div>}
                                            </div>
                                        </td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button onClick={() => openModal(item)} className="text-vps-gold hover:text-yellow-400"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                {/* Bản Mobile */}
                <div className="md:hidden flex flex-col divide-y divide-vps-gray/40">
                    {filtered.length === 0 ? <div className="p-6 text-center text-vps-ivory/40">Chưa có dữ liệu đối thủ.</div> :
                        filtered.map(item => (
                            <div key={item.id} className="p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-vps-ivory text-lg">{item.name}</div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${item.threatLevel === 'Cao' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                                            item.threatLevel === 'Trung bình' ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' :
                                                'bg-green-500/10 border-green-500/50 text-green-400'
                                        }`}>{item.threatLevel || 'Chưa rõ'}</span>
                                </div>
                                <div className="text-sm font-medium text-vps-gold">Phân khúc: {item.pricing || 'Tầm trung'}</div>
                                <div className="text-xs text-gray-400 bg-[#1A1A1A] p-3 rounded flex flex-col gap-1.5">
                                    {item.strength && <div><span className="text-green-400 font-bold mr-1">+</span>{item.strength}</div>}
                                    {item.weakness && <div><span className="text-red-400 font-bold mr-1">-</span>{item.weakness}</div>}
                                </div>
                                <div className="flex justify-end gap-3 mt-2 border-t border-vps-gray/30 pt-3">
                                    <button onClick={() => openModal(item)} className="flex items-center gap-1 text-xs text-vps-gold"><Edit className="w-3 h-3" /> Sửa</button>
                                    <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1 text-xs text-red-400"><Trash2 className="w-3 h-3" /> Xóa</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-vps-black flex w-full max-w-[100vw] overflow-x-hidden relative">
            <Sidebar />
            <div className="flex-1 md:ml-64 p-4 pt-20 md:p-8 md:pt-8 overflow-y-auto w-full">

                {/* Header Đồng bộ Cloud */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 md:mb-8">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-vps-gold">Marketing & Sales Pro</h1>
                            <Cloud className="w-5 h-5 text-green-500" title="Đã đồng bộ với Cloud" />
                        </div>
                        <p className="text-sm md:text-base text-vps-ivory opacity-60 mt-1">Hệ thống CRM & Đo lường Tỉ lệ chuyển đổi chuyên sâu.</p>
                    </div>
                    <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-vps-gold text-vps-black px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-600 transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <Plus className="w-5 h-5" />
                        <span>{activeTab === 'campaigns' ? 'Khởi tạo Chiến Dịch' : activeTab === 'customers' ? 'Thêm Lead/Khách' : 'Thêm Đối Thủ'}</span>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto gap-3 mb-6 custom-scrollbar pb-2">
                    <button onClick={() => setActiveTab('campaigns')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'campaigns' ? 'bg-vps-gold text-vps-black shadow-md scale-[1.02]' : 'bg-[#1E1E1E] text-vps-ivory border border-vps-gray hover:border-vps-gold/50'}`}><Megaphone className="w-5 h-5" /> Chiến Dịch Marketing</button>
                    <button onClick={() => setActiveTab('customers')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'customers' ? 'bg-vps-gold text-vps-black shadow-md scale-[1.02]' : 'bg-[#1E1E1E] text-vps-ivory border border-vps-gray hover:border-vps-gold/50'}`}><Briefcase className="w-5 h-5" /> Pipeline Khách Hàng (CRM)</button>
                    <button onClick={() => setActiveTab('competitors')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold whitespace-nowrap transition-all ${activeTab === 'competitors' ? 'bg-vps-gold text-vps-black shadow-md scale-[1.02]' : 'bg-[#1E1E1E] text-vps-ivory border border-vps-gray hover:border-vps-gold/50'}`}><PieChart className="w-5 h-5" /> Mạng lưới Đối Thủ</button>
                </div>

                {/* Vùng Biểu đồ & Analytics */}
                {renderAnalytics()}

                {/* Thanh Lọc & Tìm kiếm */}
                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input type="text" placeholder={`Tìm kiếm dữ liệu ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1E1E1E] border border-vps-gray rounded-xl pl-12 pr-4 py-3 text-vps-ivory focus:outline-none focus:border-vps-gold text-sm shadow-inner" />
                    </div>
                    <button className="px-4 py-3 bg-[#1E1E1E] border border-vps-gray rounded-xl text-vps-ivory hover:border-vps-gold transition-colors"><Filter className="w-5 h-5" /></button>
                </div>

                {/* Nội dung danh sách */}
                {activeTab === 'campaigns' && renderCampaigns()}
                {activeTab === 'customers' && renderCustomers()}
                {activeTab === 'competitors' && renderCompetitors()}

                {/* MODAL FORM ĐA NĂNG PRO */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-[#1E1E1E] border border-vps-gray rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="sticky top-0 bg-[#1E1E1E] border-b border-vps-gray p-5 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-vps-gold flex items-center gap-2">
                                    {activeTab === 'campaigns' && <Megaphone className="w-5 h-5" />}
                                    {activeTab === 'customers' && <Briefcase className="w-5 h-5" />}
                                    {activeTab === 'competitors' && <ShieldAlert className="w-5 h-5" />}
                                    {editingId ? 'Cập nhật Hệ thống' : 'Khởi tạo Dữ liệu'}
                                </h2>
                                <button type="button" onClick={closeModal} className="text-vps-ivory/60 hover:text-vps-ivory bg-[#252525] p-2 rounded-full"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-5">

                                {/* Form Chiến dịch */}
                                {activeTab === 'campaigns' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-1.5 block">Tên chiến dịch *</label><input required className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none transition-colors" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Tên nhận diện chiến dịch..." /></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-1.5 block">Nền tảng</label><input className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none" value={formData.platform || ''} onChange={e => setFormData({ ...formData, platform: e.target.value })} placeholder="Facebook, Google..." /></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-1.5 block">Trạng thái</label><select className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none appearance-none" value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })}><option>Đang chạy</option><option>Hoàn thành</option><option>Tạm dừng</option></select></div>
                                            <div>
                                                <label className="text-xs font-bold text-green-400 mb-1.5 block">Ngân sách (VNĐ) *</label>
                                                <input type="text" required className="w-full bg-green-500/5 border border-green-500/30 rounded-lg p-3 text-green-400 font-bold focus:border-green-500 outline-none" value={formData.budget || ''} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                                                {formData.budget && <p className="text-[10px] text-gray-500 mt-1 italic">{formatCurrency(formData.budget)}</p>}
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-orange-400 mb-1.5 block">Đã giải ngân (VNĐ)</label>
                                                <input type="text" className="w-full bg-orange-500/5 border border-orange-500/30 rounded-lg p-3 text-orange-400 font-bold focus:border-orange-500 outline-none" value={formData.spent || ''} onChange={e => setFormData({ ...formData, spent: e.target.value })} />
                                                {formData.spent && <p className="text-[10px] text-gray-500 mt-1 italic">{formatCurrency(formData.spent)}</p>}
                                            </div>
                                            <div><label className="text-xs font-bold text-purple-400 mb-1.5 block">Số Leads thu về (Chuyển đổi)</label><input type="number" className="w-full bg-purple-500/5 border border-purple-500/30 rounded-lg p-3 text-purple-400 font-bold focus:border-purple-500 outline-none" value={formData.leads || ''} onChange={e => setFormData({ ...formData, leads: e.target.value })} placeholder="Số lượng Lead..." /></div>
                                        </div>
                                    </>
                                )}

                                {/* Form CRM */}
                                {activeTab === 'customers' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-1.5 block">Tên Khách hàng / Doanh nghiệp *</label><input required className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-1.5 block">SĐT liên hệ</label><input type="tel" className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                            <div>
                                                <label className="text-xs font-bold text-purple-400 mb-1.5 block">Giá trị Hợp đồng (VNĐ)</label>
                                                <input type="text" className="w-full bg-purple-500/5 border border-purple-500/30 rounded-lg p-3 text-purple-400 font-bold focus:border-purple-500 outline-none" value={formData.dealValue || ''} onChange={e => setFormData({ ...formData, dealValue: e.target.value })} placeholder="Vd: 20000000" />
                                                {formData.dealValue && <p className="text-[10px] text-gray-500 mt-1 italic">{formatCurrency(formData.dealValue)}</p>}
                                            </div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-1.5 block">Trạng thái Phễu</label><select className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none appearance-none font-bold text-blue-400" value={formData.pipeline || ''} onChange={e => setFormData({ ...formData, pipeline: e.target.value })}><option>Khách mới</option><option>Đang tư vấn</option><option>Đã chốt</option><option>Thất bại</option></select></div>
                                            <div><label className="text-xs font-bold text-gray-400 mb-1.5 block">Nguồn Khách (Source)</label><input type="text" className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none" value={formData.source || ''} onChange={e => setFormData({ ...formData, source: e.target.value })} /></div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-1.5 block">Ghi chú & Tình trạng đàm phán</label><textarea className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none resize-none" rows="3" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Cập nhật tiến độ đàm phán, yêu cầu của khách..." /></div>
                                        </div>
                                    </>
                                )}

                                {/* Form Đối thủ */}
                                {activeTab === 'competitors' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="text-xs font-bold text-gray-400 mb-1.5 block">Tên Đối thủ / Agency *</label><input required className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Vd: XYZ Media..." /></div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Mức độ đe dọa</label>
                                                <select className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none appearance-none" value={formData.threatLevel || ''} onChange={e => setFormData({ ...formData, threatLevel: e.target.value })}>
                                                    <option>Thấp</option><option>Trung bình</option><option>Cao</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Phân khúc giá</label>
                                                <select className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-vps-gold outline-none appearance-none" value={formData.pricing || ''} onChange={e => setFormData({ ...formData, pricing: e.target.value })}>
                                                    <option>Giá rẻ</option><option>Tầm trung</option><option>Cao cấp</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-green-400 mb-1.5 block">Điểm mạnh (Strengths)</label><textarea className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-green-400 outline-none resize-none" rows="2" value={formData.strength || ''} onChange={e => setFormData({ ...formData, strength: e.target.value })} placeholder="Ưu thế của đối thủ..." /></div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-red-400 mb-1.5 block">Điểm yếu (Weaknesses)</label><textarea className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-red-400 outline-none resize-none" rows="2" value={formData.weakness || ''} onChange={e => setFormData({ ...formData, weakness: e.target.value })} placeholder="Hạn chế mà ta có thể khai thác..." /></div>
                                            <div className="col-span-2"><label className="text-xs font-bold text-blue-400 mb-1.5 block">Kế hoạch đối phó (Action Plan)</label><textarea className="w-full bg-[#1A1A1A] border border-vps-gray rounded-lg p-3 text-vps-ivory focus:border-blue-400 outline-none resize-none" rows="2" value={formData.actionPlan || ''} onChange={e => setFormData({ ...formData, actionPlan: e.target.value })} placeholder="Chiến lược cạnh tranh..." /></div>
                                        </div>
                                    </>
                                )}

                                {/* Nút thao tác */}
                                <div className="pt-6 border-t border-vps-gray flex gap-4">
                                    <button type="button" onClick={closeModal} className="w-1/3 px-4 py-3.5 border border-vps-gray text-vps-ivory rounded-xl font-bold hover:bg-[#252525] transition-colors">Hủy bỏ</button>
                                    <button type="submit" className="w-2/3 px-4 py-3.5 bg-vps-gold text-vps-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-600 transition-colors shadow-lg"><Save className="w-5 h-5" /> Xác nhận Lưu Dữ liệu</button>
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