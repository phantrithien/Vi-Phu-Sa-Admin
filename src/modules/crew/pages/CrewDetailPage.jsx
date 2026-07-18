import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import AppShell from '../../../components/AppShell';
import EmptyState from '../../../components/ui/EmptyState';
import LoadingState from '../../../components/ui/LoadingState';
import { useToast } from '../../../components/ui/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS, hasAnyPermission } from '../../../constants/permissions';
import { isManagementRole } from '../../../constants/roles';
import { listProjects } from '../../../services/projectService';
import { getCrewById } from '../crewService';
import { listCrewAssignmentsByCrew } from '../crewAssignmentService';
import { createCrewReview, deleteCrewReview, listCrewReviewsByCrew } from '../crewReviewService';
import CrewOverview from '../components/CrewOverview';
import CrewProjectHistory from '../components/CrewProjectHistory';
import CrewReviewList from '../components/CrewReviewList';

const CrewDetailPage = () => {
    const { crewId } = useParams();
    const { pushToast } = useToast();
    const { currentUser, userRole } = useAuth();

    const [loading, setLoading] = useState(true);
    const [crew, setCrew] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [projects, setProjects] = useState([]);

    const canManage = hasAnyPermission(userRole, [PERMISSIONS.CREW_UPDATE]) || isManagementRole(userRole);
    const projectNames = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project.title])), [projects]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [crewData, assignmentRows, reviewRows, projectRows] = await Promise.all([
                getCrewById(crewId),
                listCrewAssignmentsByCrew(crewId),
                listCrewReviewsByCrew(crewId),
                listProjects(),
            ]);
            setCrew(crewData);
            setAssignments(assignmentRows);
            setReviews(reviewRows);
            setProjects(projectRows);
        } catch (error) {
            pushToast(error.message || 'Không thể tải hồ sơ crew.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [crewId]);

    const handleCreateReview = async ({ rating, comment }) => {
        try {
            await createCrewReview({ crewId, rating, comment }, currentUser?.uid || null);
            pushToast('Đã thêm review.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể thêm review.', 'error');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Xác nhận xóa review này?')) return;
        try {
            await deleteCrewReview(reviewId);
            pushToast('Đã xóa review.', 'success');
            await loadData();
        } catch (error) {
            pushToast(error.message || 'Không thể xóa review.', 'error');
        }
    };

    if (loading) {
        return <AppShell title="Crew Detail" subtitle="Đang tải hồ sơ crew"><LoadingState title="Đang tải hồ sơ" /></AppShell>;
    }

    if (!crew) {
        return <AppShell title="Crew Detail"><EmptyState title="Không tìm thấy crew" description="Crew có thể đã bị xóa." /></AppShell>;
    }

    return (
        <AppShell title="Crew Detail" subtitle={crew.name}>
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                    <CrewOverview crew={crew} />
                    <div className="rounded-2xl border border-vps-gray/20 bg-[#151515] p-5">
                        <p className="mb-3 text-sm text-vps-gold/70">Lịch sử dự án</p>
                        <CrewProjectHistory assignments={assignments} projectNames={projectNames} />
                    </div>
                </div>
                <div className="rounded-2xl border border-vps-gray/20 bg-[#151515] p-5">
                    <p className="mb-3 text-sm text-vps-gold/70">Review nội bộ</p>
                    <CrewReviewList reviews={reviews} canManage={canManage} onCreate={handleCreateReview} onDelete={handleDeleteReview} />
                </div>
            </div>
        </AppShell>
    );
};

export default CrewDetailPage;
