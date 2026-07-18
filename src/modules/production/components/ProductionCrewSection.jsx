import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';

import { listCrew } from '../../crew/crewService';
import { createCrewAssignment, deleteCrewAssignment, listCrewAssignmentsByProductionDay } from '../../crew/crewAssignmentService';
import CrewAssignmentPicker from '../../crew/components/CrewAssignmentPicker';

const ProductionCrewSection = ({ productionDay, canManage, userId, onClose }) => {
    const [assignments, setAssignments] = useState([]);
    const [crewOptions, setCrewOptions] = useState([]);
    const crewNames = useMemo(() => Object.fromEntries(crewOptions.map((item) => [item.id, item.name])), [crewOptions]);

    const load = async () => {
        const [assignmentRows, crewRows] = await Promise.all([listCrewAssignmentsByProductionDay(productionDay.id), listCrew()]);
        setAssignments(assignmentRows);
        setCrewOptions(crewRows);
    };

    useEffect(() => { load().catch(() => { setAssignments([]); setCrewOptions([]); }); }, [productionDay.id]);

    const handleAssign = async (payload) => {
        await createCrewAssignment({ ...payload, projectId: productionDay.projectId, productionDayId: productionDay.id, date: productionDay.date }, userId);
        await load();
    };

    const handleRemove = async (assignmentId) => {
        if (!window.confirm('Xác nhận gỡ crew khỏi ngày sản xuất này?')) return;
        await deleteCrewAssignment(assignmentId);
        await load();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 md:items-center md:justify-center">
            <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-vps-gray/20 bg-[#151515] p-5 md:rounded-2xl">
                <div className="flex items-center justify-between">
                    <div><p className="text-sm text-vps-gold/70">Crew ngày sản xuất</p><h2 className="text-lg font-semibold text-vps-ivory">{productionDay.title}</h2></div>
                    <button onClick={onClose} className="rounded-lg bg-[#222] p-2 text-vps-ivory"><X className="h-5 w-5" /></button>
                </div>

                {canManage ? <div className="mt-5"><CrewAssignmentPicker crewOptions={crewOptions} onAssign={handleAssign} /></div> : null}

                <div className="mt-4 space-y-2">
                    {assignments.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa gán crew cho ngày này.</p>
                    ) : assignments.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                            <div><p className="font-medium text-vps-ivory">{crewNames[item.crewId] || 'Crew đã bị xóa'}</p><p className="text-xs text-vps-ivory/60">{item.role || '---'} · {Number(item.rate || 0).toLocaleString('vi-VN')} đ</p></div>
                            {canManage ? <button onClick={() => handleRemove(item.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button> : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductionCrewSection;
