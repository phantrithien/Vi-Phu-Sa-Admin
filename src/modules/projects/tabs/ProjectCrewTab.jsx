import React, { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { listCrew } from '../../crew/crewService';
import { createCrewAssignment, deleteCrewAssignment, listCrewAssignmentsByProject } from '../../crew/crewAssignmentService';
import CrewAssignmentPicker from '../../crew/components/CrewAssignmentPicker';

const ProjectCrewTab = ({ project }) => {
    const { currentUser, userRole } = useAuth();
    const { pushToast } = useToast();
    const [assignments, setAssignments] = useState([]);
    const [crewOptions, setCrewOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const canManage = hasAnyPermission(userRole, [PERMISSIONS.CREW_CREATE, PERMISSIONS.CREW_UPDATE, PERMISSIONS.CREW_DELETE]) || isManagementRole(userRole);
    const crewNames = useMemo(() => Object.fromEntries(crewOptions.map((item) => [item.id, item.name])), [crewOptions]);

    const load = async () => {
        setLoading(true);
        try {
            const [assignmentRows, crewRows] = await Promise.all([listCrewAssignmentsByProject(project.id), listCrew()]);
            setAssignments(assignmentRows);
            setCrewOptions(crewRows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải crew của dự án.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [project.id]);

    const handleAssign = async (payload) => {
        try {
            await createCrewAssignment({ ...payload, projectId: project.id }, currentUser?.uid);
            pushToast('Đã gán crew vào dự án.', 'success');
            await load();
        } catch (error) {
            pushToast(error.message || 'Không thể gán crew.', 'error');
        }
    };

    const handleRemove = async (assignmentId) => {
        if (!window.confirm('Xác nhận gỡ crew khỏi dự án?')) return;
        try {
            await deleteCrewAssignment(assignmentId);
            pushToast('Đã gỡ crew.', 'success');
            await load();
        } catch (error) {
            pushToast(error.message || 'Không thể gỡ crew.', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-vps-gold/70">Crew của dự án</p>
                <p className="text-sm text-vps-ivory/60">Danh sách nhân sự/freelancer tham gia dự án này.</p>
            </div>

            {canManage ? <CrewAssignmentPicker crewOptions={crewOptions} onAssign={handleAssign} /> : null}

            {loading ? (
                <p className="text-sm text-vps-ivory/60">Đang tải crew...</p>
            ) : assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-vps-gray/30 p-4 text-sm text-vps-ivory/60">Chưa gán crew nào cho dự án.</div>
            ) : (
                <div className="space-y-2">
                    {assignments.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-vps-gray/20 bg-[#181818] px-3 py-2 text-sm text-vps-ivory/80">
                            <div><p className="font-medium text-vps-ivory">{crewNames[item.crewId] || 'Crew đã bị xóa'}</p><p className="text-xs text-vps-ivory/60">{item.role || '---'} · {Number(item.rate || 0).toLocaleString('vi-VN')} đ</p></div>
                            {canManage ? <button onClick={() => handleRemove(item.id)} className="text-rose-300"><Trash2 className="h-4 w-4" /></button> : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectCrewTab;
