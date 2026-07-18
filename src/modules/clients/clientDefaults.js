import { CLIENT_STATUS } from '../../constants/clientStatus';
import { CLIENT_TYPES } from '../../constants/clientTypes';

export const getDefaultClient = () => ({
    name: '',
    type: CLIENT_TYPES.COMPANY,
    status: CLIENT_STATUS.LEAD,
    industry: '',
    source: '',
    phone: '',
    email: '',
    address: '',
    taxCode: '',
    notes: '',
    primaryContactId: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
    isDeleted: false,
});

export const getDefaultClientContact = () => ({
    clientId: '',
    name: '',
    role: '',
    phone: '',
    email: '',
    isPrimary: false,
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultClientNote = () => ({
    clientId: '',
    content: '',
    type: 'note',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});