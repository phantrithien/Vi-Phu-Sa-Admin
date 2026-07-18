import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const PROJECT_COLLECTION = 'projects';

export const PROJECT_STATUSES = {
    PLANNING: 'planning',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold',
};

export const PROJECT_PRIORITIES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
};

export const buildProjectCode = (year = new Date().getFullYear().toString(), index = 1) => {
    const normalized = String(index).padStart(3, '0');
    return `PRJ-${year}-${normalized}`;
};

export const normalizeProjectClient = (data = {}) => {
    const clientId = String(data.clientId || '').trim();
    const clientName = String(data.clientName || data.client || '').trim();

    return {
        clientId,
        clientName,
        client: clientName,
    };
};

export const validateProjectData = (data = {}) => {
    const errors = [];

    if (!data.title || String(data.title).trim().length < 3) {
        errors.push('title');
    }
    const normalizedClient = normalizeProjectClient(data);
    if (!normalizedClient.clientId && normalizedClient.clientName.length < 2) {
        errors.push('client');
    }
    if (!data.producer || String(data.producer).trim().length < 2) {
        errors.push('producer');
    }
    if (!data.status || !Object.values(PROJECT_STATUSES).includes(data.status)) {
        errors.push('status');
    }
    if (!data.priority || !Object.values(PROJECT_PRIORITIES).includes(data.priority)) {
        errors.push('priority');
    }
    if (!data.startDate) {
        errors.push('startDate');
    }

    return { isValid: errors.length === 0, errors };
};

export const listProjects = async () => {
    const q = query(collection(db, PROJECT_COLLECTION), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getProjectById = async (id) => {
    const snapshot = await getDoc(doc(db, PROJECT_COLLECTION, id));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const createProject = async (payload) => {
    const normalizedClient = normalizeProjectClient(payload);
    const validation = validateProjectData({ ...payload, ...normalizedClient });
    if (!validation.isValid) {
        throw new Error(`Invalid project payload: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const projectCode = payload.code || buildProjectCode(new Date().getFullYear().toString(), Math.floor(Math.random() * 900) + 1);
    const ref = await addDoc(collection(db, PROJECT_COLLECTION), {
        ...payload,
        ...normalizedClient,
        code: projectCode,
        createdAt: now,
        updatedAt: now,
    });
    return { id: ref.id, code: projectCode };
};

export const updateProject = async (id, payload) => {
    const normalizedClient = normalizeProjectClient(payload);
    const validation = validateProjectData({ ...payload, ...normalizedClient });
    if (!validation.isValid) {
        throw new Error(`Invalid project payload: ${validation.errors.join(', ')}`);
    }

    await updateDoc(doc(db, PROJECT_COLLECTION, id), {
        ...payload,
        ...normalizedClient,
        updatedAt: Date.now(),
    });
};

export const deleteProject = async (id) => {
    await deleteDoc(doc(db, PROJECT_COLLECTION, id));
};
