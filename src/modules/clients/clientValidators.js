import { CLIENT_STATUS_OPTIONS } from '../../constants/clientStatus';
import { CLIENT_TYPE_OPTIONS } from '../../constants/clientTypes';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateClientPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.name || '').trim()) {
        errors.name = 'Tên khách hàng là bắt buộc.';
    }

    if (!payload.type || !CLIENT_TYPE_OPTIONS.includes(payload.type)) {
        errors.type = 'Loại khách hàng không hợp lệ.';
    }

    if (!payload.status || !CLIENT_STATUS_OPTIONS.includes(payload.status)) {
        errors.status = 'Trạng thái khách hàng không hợp lệ.';
    }

    if (payload.email && !EMAIL_REGEX.test(String(payload.email).trim())) {
        errors.email = 'Email không hợp lệ.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateClientContactPayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.clientId || '').trim()) {
        errors.clientId = 'Thiếu clientId cho người liên hệ.';
    }

    if (!String(payload.name || '').trim()) {
        errors.name = 'Tên người liên hệ là bắt buộc.';
    }

    if (payload.email && !EMAIL_REGEX.test(String(payload.email).trim())) {
        errors.email = 'Email người liên hệ không hợp lệ.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

export const validateClientNotePayload = (payload = {}) => {
    const errors = {};

    if (!String(payload.clientId || '').trim()) {
        errors.clientId = 'Thiếu clientId cho ghi chú.';
    }

    if (!String(payload.content || '').trim()) {
        errors.content = 'Nội dung ghi chú là bắt buộc.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};