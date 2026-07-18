import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { useToast } from '../../../components/ui/ToastProvider';
import { createProductionDay, deleteProductionDay, listProductionDaysByProject, updateProductionDay } from '../../production/productionService';
import ProductionDayFormDrawer from '../../production/components/ProductionDayFormDrawer';
import ProductionDayList from '../../production/components/ProductionDayList';
import RunSheetEditor from '../../production/components/RunSheetEditor';
import ProductionCrewSection from '../../production/components/ProductionCrewSection';
import ProductionEquipmentSection from '../../production/components/ProductionEquipmentSection';

const ProjectProductionTab = ({ project }) => {
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();
    const { pushToast } = useToast();
    const [days, setDays] = useState([]); const [loading, setLoading] = useState(true); const [drawer, setDrawer] = useState(false); const [editing, setEditing] = useState(null); const [runSheetDay, setRunSheetDay] = useState(null); const [crewDay, setCrewDay] = useState(null); const [equipmentDay, setEquipmentDay] = useState(null); const [saving, setSaving] = useState(false);
    const canManage = hasAnyPermission(userRole, [PERMISSIONS.PRODUCTION_CREATE, PERMISSIONS.PRODUCTION_UPDATE, PERMISSIONS.PRODUCTION_DELETE, PERMISSIONS.MANAGE_PRODUCTION]);
    const load = async () => { setLoading(true); try { setDays(await listProductionDaysByProject(project.id)); } catch (error) { pushToast(error.message || 'Không thể tải kế hoạch production.', 'error'); } finally { setLoading(false); } };
    useEffect(() => { load(); }, [project.id]);
    const save = async (values) => { setSaving(true); try { if (editing) await updateProductionDay(editing.id, { ...editing, ...values, projectId: project.id }, currentUser?.uid); else await createProductionDay({ ...values, projectId: project.id }, currentUser?.uid); setDrawer(false); setEditing(null); await load(); pushToast('Đã lưu ngày sản xuất.', 'success'); } catch (error) { pushToast(error.message || 'Không thể lưu ngày sản xuất.', 'error'); } finally { setSaving(false); } };
    const remove = async (day) => { if (!window.confirm(`Xóa "${day.title}"?`)) return; try { await deleteProductionDay(day.id); await load(); pushToast('Đã xóa ngày sản xuất.', 'success'); } catch (error) { pushToast(error.message || 'Không thể xóa ngày sản xuất.', 'error'); } };
    return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-vps-gold/70">Production plan</p><p className="text-sm text-vps-ivory/60">Lịch quay, call time, run sheet và call sheet của dự án.</p></div>{canManage ? <button onClick={() => { setEditing(null); setDrawer(true); }} className="inline-flex items-center gap-2 rounded-lg bg-vps-gold px-3 py-2 text-sm font-semibold text-vps-black"><Plus className="h-4 w-4" />Thêm ngày sản xuất</button> : null}</div>{loading ? <p className="py-6 text-sm text-vps-ivory/60">Đang tải kế hoạch production...</p> : <ProductionDayList days={days} canManage={canManage} onEdit={(day) => { setEditing(day); setDrawer(true); }} onDelete={remove} onOpenRunSheet={setRunSheetDay} onOpenCrew={setCrewDay} onOpenEquipment={setEquipmentDay} onOpenCallSheet={(day) => navigate(`/app/production/call-sheets/${day.id}`)} />}{drawer ? <ProductionDayFormDrawer open initialValue={editing} onClose={() => { setDrawer(false); setEditing(null); }} onSubmit={save} saving={saving} /> : null}{runSheetDay ? <RunSheetEditor productionDay={runSheetDay} canManage={canManage} userId={currentUser?.uid} onClose={() => setRunSheetDay(null)} /> : null}{crewDay ? <ProductionCrewSection productionDay={crewDay} canManage={canManage} userId={currentUser?.uid} onClose={() => setCrewDay(null)} /> : null}{equipmentDay ? <ProductionEquipmentSection productionDay={equipmentDay} canManage={canManage} userId={currentUser?.uid} onClose={() => setEquipmentDay(null)} /> : null}</div>;
};

export default ProjectProductionTab;