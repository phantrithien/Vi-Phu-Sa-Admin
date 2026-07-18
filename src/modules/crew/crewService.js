import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultCrew } from './crewDefaults';
import { validateCrewPayload } from './crewValidators';

const CREW_COLLECTION = 'crew';

const normalizeCrew = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const listCrew = async ({ status = null, role = null, search = '' } = {}) => {
    const snapshot = await getDocs(collection(db, CREW_COLLECTION));
    const term = String(search || '').trim().toLowerCase();

    return snapshot.docs
        .map(normalizeCrew)
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => (role ? (item.roles || []).includes(role) : true))
        .filter((item) => {
            if (!term) return true;
            const haystack = [item.name, item.phone, item.email, ...(item.roles || [])].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(term);
        })
        .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
};

export const getCrewById = async (id) => {
    const snapshot = await getDoc(doc(db, CREW_COLLECTION, id));
    return snapshot.exists() ? normalizeCrew(snapshot) : null;
};

export const createCrew = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultCrew(),
        ...payload,
        name: String(payload.name || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim(),
        notes: String(payload.notes || '').trim(),
        roles: Array.isArray(payload.roles) ? payload.roles : [],
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        dayRate: Number(payload.dayRate || 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateCrewPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, CREW_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateCrew = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        name: String(payload.name || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim(),
        notes: String(payload.notes || '').trim(),
        roles: Array.isArray(payload.roles) ? payload.roles : [],
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        dayRate: Number(payload.dayRate || 0),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateCrewPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, CREW_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteCrew = async (id) => {
    await deleteDoc(doc(db, CREW_COLLECTION, id));
    return true;
};
