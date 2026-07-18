import { EQUIPMENT_STATUS_OPTIONS } from '../../constants/equipmentStatus';
import { EQUIPMENT_CATEGORY_OPTIONS } from '../../constants/equipmentCategories';

export const validateEquipmentPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.name || '').trim()) {
        errors.name = 'Tên thiết bị là bắt buộc.';
    }

    if (!payload.category || !EQUIPMENT_CATEGORY_OPTIONS.includes(payload.category)) {
        errors.category = 'Danh mục thiết bị không hợp lệ.';
    }

    if (!payload.status || !EQUIPMENT_STATUS_OPTIONS.includes(payload.status)) {
        errors.status = 'Trạng thái thiết bị không hợp lệ.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateEquipmentBookingPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.equipmentId || '').trim()) {
        errors.equipmentId = 'equipmentId là bắt buộc.';
    }

    if (!String(payload.projectId || '').trim()) {
        errors.projectId = 'projectId là bắt buộc.';
    }

    if (!String(payload.startDate || '').trim()) {
        errors.startDate = 'Ngày bắt đầu là bắt buộc.';
    }

    if (!String(payload.endDate || '').trim()) {
        errors.endDate = 'Ngày kết thúc là bắt buộc.';
    }

    if (payload.startDate && payload.endDate && String(payload.startDate) > String(payload.endDate)) {
        errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateEquipmentMaintenanceLogPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.equipmentId || '').trim()) {
        errors.equipmentId = 'equipmentId là bắt buộc.';
    }

    if (!String(payload.description || '').trim()) {
        errors.description = 'Mô tả log là bắt buộc.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
