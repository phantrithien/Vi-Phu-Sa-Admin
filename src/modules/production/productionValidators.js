import { PRODUCTION_STATUS_OPTIONS } from '../../constants/productionStatus';
import { PRODUCTION_TYPE_OPTIONS } from '../../constants/productionTypes';

export const validateProductionDayPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.projectId || '').trim()) {
        errors.projectId = 'projectId là bắt buộc.';
    }

    if (!String(payload.date || '').trim()) {
        errors.date = 'Ngày sản xuất là bắt buộc.';
    }

    if (!payload.status || !PRODUCTION_STATUS_OPTIONS.includes(payload.status)) {
        errors.status = 'Trạng thái production không hợp lệ.';
    }

    if (!payload.type || !PRODUCTION_TYPE_OPTIONS.includes(payload.type)) {
        errors.type = 'Loại production không hợp lệ.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateRunSheetItemPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.productionDayId || '').trim()) {
        errors.productionDayId = 'productionDayId là bắt buộc.';
    }

    if (!String(payload.activity || payload.title || '').trim()) {
        errors.activity = 'Hoạt động run sheet là bắt buộc.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateCallSheetPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.productionDayId || '').trim()) {
        errors.productionDayId = 'productionDayId là bắt buộc.';
    }

    if (!String(payload.projectId || '').trim()) {
        errors.projectId = 'projectId là bắt buộc.';
    }

    if (!String(payload.title || '').trim()) {
        errors.title = 'Tiêu đề call sheet là bắt buộc.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};