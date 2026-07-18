import { EQUIPMENT_STATUS } from '../../constants/equipmentStatus';
import { EQUIPMENT_CATEGORIES } from '../../constants/equipmentCategories';

export const getDefaultEquipment = () => ({
    name: '',
    category: EQUIPMENT_CATEGORIES.CAMERA,
    serialNumber: '',
    status: EQUIPMENT_STATUS.AVAILABLE,
    condition: 'good',
    currentHolderId: '',
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultEquipmentBooking = () => ({
    equipmentId: '',
    projectId: '',
    productionDayId: '',
    startDate: '',
    endDate: '',
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultEquipmentMaintenanceLog = () => ({
    equipmentId: '',
    type: 'maintenance',
    description: '',
    date: '',
    createdAt: Date.now(),
    createdBy: null,
});
