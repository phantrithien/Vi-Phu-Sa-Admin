import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultProductionDay } from './productionDefaults';
import { validateProductionDayPayload } from './productionValidators';

const PRODUCTION_DAY_COLLECTION = 'productionDays';

const normalizeProductionDay = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const createProductionDay = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultProductionDay(),
        ...payload,
        projectId: String(payload.projectId || '').trim(),
        date: String(payload.date || '').trim(),
        title: String(payload.title || '').trim(),
        location: String(payload.location || '').trim(),
        callTime: String(payload.callTime || '').trim(),
        wrapTime: String(payload.wrapTime || '').trim(),
        notes: String(payload.notes || '').trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateProductionDayPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, PRODUCTION_DAY_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateProductionDay = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        projectId: String(payload.projectId || '').trim(),
        date: String(payload.date || '').trim(),
        title: String(payload.title || '').trim(),
        location: String(payload.location || '').trim(),
        callTime: String(payload.callTime || '').trim(),
        wrapTime: String(payload.wrapTime || '').trim(),
        notes: String(payload.notes || '').trim(),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateProductionDayPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, PRODUCTION_DAY_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteProductionDay = async (id) => {
    await deleteDoc(doc(db, PRODUCTION_DAY_COLLECTION, id));
    return true;
};

export const getProductionDay = async (id) => {
    const snapshot = await getDoc(doc(db, PRODUCTION_DAY_COLLECTION, id));
    return snapshot.exists() ? normalizeProductionDay(snapshot) : null;
};

export const listProductionDaysByProject = async (projectId) => {
    const q = query(collection(db, PRODUCTION_DAY_COLLECTION), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(normalizeProductionDay)
        .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
};

export const listProductionDaysByDate = async (date) => {
    const q = query(collection(db, PRODUCTION_DAY_COLLECTION), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(normalizeProductionDay)
        .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
};

export const listProductionDays = async () => {
    const snapshot = await getDocs(collection(db, PRODUCTION_DAY_COLLECTION));
    return snapshot.docs
        .map(normalizeProductionDay)
        .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
};