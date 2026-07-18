import { CREW_STATUS } from '../../constants/crewStatus';

export const CREW_TYPES = { STAFF: 'staff', FREELANCER: 'freelancer' };
export const CREW_TYPE_OPTIONS = Object.values(CREW_TYPES);
export const CREW_TYPE_LABELS = {
    [CREW_TYPES.STAFF]: 'Nhân sự cơ hữu',
    [CREW_TYPES.FREELANCER]: 'Freelancer',
};

export const getDefaultCrew = () => ({
    name: '',
    type: CREW_TYPES.FREELANCER,
    roles: [],
    skills: [],
    dayRate: 0,
    phone: '',
    email: '',
    status: CREW_STATUS.AVAILABLE,
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultCrewAssignment = () => ({
    crewId: '',
    projectId: '',
    productionDayId: '',
    role: '',
    rate: 0,
    date: '',
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: null,
    updatedBy: null,
});

export const getDefaultCrewReview = () => ({
    crewId: '',
    projectId: '',
    rating: 5,
    comment: '',
    createdAt: Date.now(),
    createdBy: null,
});
