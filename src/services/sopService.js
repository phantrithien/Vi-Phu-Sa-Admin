import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const SOP_COLLECTION = 'sops';

export const SOP_STATUSES = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    ARCHIVED: 'archived',
};

export const SOP_CATEGORIES = {
    OPERATIONS: 'operations',
    FINANCE: 'finance',
    HR: 'hr',
    MARKETING: 'marketing',
};

export const validateSopData = (data = {}) => {
    const errors = [];

    if (!data.title || String(data.title).trim().length < 3) {
        errors.push('title');
    }
    if (!data.category || !Object.values(SOP_CATEGORIES).includes(data.category)) {
        errors.push('category');
    }
    if (!data.status || !Object.values(SOP_STATUSES).includes(data.status)) {
        errors.push('status');
    }
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
        errors.push('steps');
    } else {
        data.steps.forEach((step, index) => {
            if (!step?.title || String(step.title).trim().length < 2) {
                errors.push(`steps[${index}].title`);
            }
        });
    }

    return { isValid: errors.length === 0, errors };
};

export const listSops = async ({ includeArchived = false } = {}) => {
    const q = query(collection(db, SOP_COLLECTION), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const rows = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    return includeArchived ? rows : rows.filter((item) => item.status !== SOP_STATUSES.ARCHIVED);
};

export const getSopById = async (id) => {
    const snapshot = await getDoc(doc(db, SOP_COLLECTION, id));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const createSop = async (payload) => {
    const validation = validateSopData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid SOP payload: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const ref = await addDoc(collection(db, SOP_COLLECTION), {
        ...payload,
        createdAt: now,
        updatedAt: now,
        isArchived: payload.status === SOP_STATUSES.ARCHIVED,
    });
    return ref.id;
};

export const updateSop = async (id, payload) => {
    const validation = validateSopData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid SOP payload: ${validation.errors.join(', ')}`);
    }

    await updateDoc(doc(db, SOP_COLLECTION, id), {
        ...payload,
        updatedAt: Date.now(),
        isArchived: payload.status === SOP_STATUSES.ARCHIVED,
    });
};

export const archiveSop = async (id) => {
    await updateDoc(doc(db, SOP_COLLECTION, id), {
        status: SOP_STATUSES.ARCHIVED,
        isArchived: true,
        updatedAt: Date.now(),
    });
};

export const duplicateSop = async (id) => {
    const source = await getSopById(id);
    if (!source) {
        throw new Error('SOP not found');
    }

    const payload = {
        title: `${source.title || 'Untitled SOP'} (Copy)`,
        category: source.category || SOP_CATEGORIES.OPERATIONS,
        status: SOP_STATUSES.DRAFT,
        summary: source.summary || '',
        steps: Array.isArray(source.steps) && source.steps.length > 0
            ? source.steps.map((step) => ({
                title: String(step.title || '').trim(),
                description: String(step.description || '').trim(),
            }))
            : [{ title: 'New step', description: '' }],
    };

    return createSop(payload);
};

export const deleteSop = async (id) => {
    await deleteDoc(doc(db, SOP_COLLECTION, id));
};
