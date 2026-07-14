import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const ARCHIVE_COLLECTION = 'archives';

export const validateArchiveData = (payload = {}) => {
    const errors = [];

    if (!String(payload.projectId || '').trim()) errors.push('projectId');
    if (!String(payload.projectTitle || '').trim()) errors.push('projectTitle');

    return { isValid: errors.length === 0, errors };
};

export const createArchiveFromProject = async (project = {}, finance = {}, links = []) => {
    const payload = {
        projectId: project.id,
        projectTitle: project.title,
        client: project.client || '',
        producer: project.producer || '',
        summary: project.summary || '',
    };
    const validation = validateArchiveData(payload);
    if (!validation.isValid) {
        throw new Error(`Invalid archive payload: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const record = {
        ...payload,
        status: 'archived',
        archivedAt: now,
        finance: {
            revenue: Number(finance.revenue || 0),
            cost: Number(finance.cost || 0),
            profit: Number(finance.profit || 0),
        },
        fileLinks: Array.isArray(links)
            ? links.map((link) => ({
                title: link.title || '',
                url: link.url || '',
                note: link.note || '',
            }))
            : [],
        postMortem: {
            whatWentWell: '',
            whatWentWrong: '',
            lessonsLearned: '',
        },
        createdAt: now,
        updatedAt: now,
    };

    const ref = await addDoc(collection(db, ARCHIVE_COLLECTION), record);
    return { id: ref.id, ...record };
};

export const listArchives = async () => {
    const q = query(collection(db, ARCHIVE_COLLECTION), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
};

export const getArchiveById = async (id) => {
    const snapshot = await getDoc(doc(db, ARCHIVE_COLLECTION, id));
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const updateArchivePostMortem = async (id, postMortem = {}) => {
    await updateDoc(doc(db, ARCHIVE_COLLECTION, id), {
        postMortem: {
            whatWentWell: String(postMortem.whatWentWell || '').trim(),
            whatWentWrong: String(postMortem.whatWentWrong || '').trim(),
            lessonsLearned: String(postMortem.lessonsLearned || '').trim(),
        },
        updatedAt: Date.now(),
    });
};
