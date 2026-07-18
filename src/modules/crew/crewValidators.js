import { CREW_STATUS_OPTIONS } from '../../constants/crewStatus';
import { CREW_ROLE_OPTIONS } from '../../constants/crewRoles';

export const validateCrewPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.name || '').trim()) {
        errors.name = 'Tên crew là bắt buộc.';
    }

    if (!payload.status || !CREW_STATUS_OPTIONS.includes(payload.status)) {
        errors.status = 'Trạng thái crew không hợp lệ.';
    }

    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    if (roles.some((role) => !CREW_ROLE_OPTIONS.includes(role))) {
        errors.roles = 'Vai trò crew không hợp lệ.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateCrewAssignmentPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.crewId || '').trim()) {
        errors.crewId = 'crewId là bắt buộc.';
    }

    if (!String(payload.projectId || '').trim()) {
        errors.projectId = 'projectId là bắt buộc.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateCrewReviewPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.crewId || '').trim()) {
        errors.crewId = 'crewId là bắt buộc.';
    }

    const rating = Number(payload.rating);
    if (!rating || rating < 1 || rating > 5) {
        errors.rating = 'Rating phải từ 1 đến 5.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
