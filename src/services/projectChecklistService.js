export const buildChecklistFromSop = (sop = {}, projectId = '') => {
    const steps = Array.isArray(sop?.steps) ? sop.steps : [];

    return steps
        .filter((step) => step?.title)
        .map((step, index) => ({
            id: `${projectId || 'project'}-check-${index + 1}`,
            title: step.title.trim(),
            completed: false,
            sourceSopId: sop?.id || null,
        }));
};

export const mergeChecklistFromSop = (existingChecklist = [], sop = {}, projectId = '') => {
    const generated = buildChecklistFromSop(sop, projectId);

    return generated.map((step, index) => ({
        ...step,
        ...(existingChecklist[index] || {}),
    }));
};

export const calculateChecklistProgress = (checklist = []) => {
    const safeChecklist = Array.isArray(checklist) ? checklist : [];
    const completed = safeChecklist.filter((item) => Boolean(item?.completed)).length;
    const total = safeChecklist.length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
        total,
        completed,
        completionRate,
    };
};
