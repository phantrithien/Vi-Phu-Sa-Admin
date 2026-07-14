import { addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const FILE_LINK_COLLECTION = 'file_links';

const isValidUrl = (value) => {
    try {
        const url = new URL(String(value || '').trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

export const validateFileLinkData = (payload = {}) => {
    const errors = [];

    if (!String(payload.projectId || '').trim()) errors.push('projectId');
    if (!String(payload.title || '').trim()) errors.push('title');
    if (!isValidUrl(payload.url)) errors.push('url');

    return { isValid: errors.length === 0, errors };
};

export const createFileLink = async (payload) => {
    const validation = validateFileLinkData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid file link payload: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const record = {
        projectId: String(payload.projectId).trim(),
        title: String(payload.title).trim(),
        url: String(payload.url).trim(),
        note: String(payload.note || '').trim(),
        createdAt: now,
        updatedAt: now,
    };

    const ref = await addDoc(collection(db, FILE_LINK_COLLECTION), record);
    return { id: ref.id, ...record };
};

export const listFileLinks = async ({ projectId = '' } = {}) => {
    const constraints = [];
    if (projectId) constraints.push(where('projectId', '==', projectId));

    const q = query(collection(db, FILE_LINK_COLLECTION), ...constraints, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};
