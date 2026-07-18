import { PRODUCTION_STATUS } from '../../constants/productionStatus';
import { PRODUCTION_TYPES } from '../../constants/productionTypes';

export const getDefaultProductionDay = () => ({
    projectId: '',
    date: '',
    title: '',
    location: '',
    callTime: '',
    wrapTime: '',
    status: PRODUCTION_STATUS.DRAFT,
    type: PRODUCTION_TYPES.SHOOTING,
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultRunSheetItem = () => ({
    productionDayId: '',
    time: '',
    activity: '',
    title: '',
    description: '',
    owner: '',
    location: '',
    note: '',
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultCallSheet = () => ({
    productionDayId: '',
    projectId: '',
    title: '',
    date: '',
    location: '',
    status: 'draft',
    crewBrief: '',
    runSheetItems: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});