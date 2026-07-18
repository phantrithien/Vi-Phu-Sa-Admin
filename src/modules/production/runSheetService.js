import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { getDefaultRunSheetItem } from './productionDefaults';
import { validateRunSheetItemPayload } from './productionValidators';

const RUN_SHEET_COLLECTION = 'runSheetItems';

const normalizeRunSheetItem = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
});

export const createRunSheetItem = async (payload = {}, userId = null) => {
    const nextPayload = {
        ...getDefaultRunSheetItem(),
        ...payload,
        productionDayId: String(payload.productionDayId || '').trim(),
        time: String(payload.time || '').trim(),
        activity: String(payload.activity || payload.title || '').trim(),
        title: String(payload.title || '').trim(),
        description: String(payload.description || '').trim(),
        owner: String(payload.owner || '').trim(),
        location: String(payload.location || '').trim(),
        note: String(payload.note || '').trim(),
        order: Number(payload.order || 0),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        updatedBy: userId,
    };

    const validation = validateRunSheetItemPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    const ref = await addDoc(collection(db, RUN_SHEET_COLLECTION), nextPayload);
    return { id: ref.id, ...nextPayload };
};

export const updateRunSheetItem = async (id, payload = {}, userId = null) => {
    const nextPayload = {
        ...payload,
        productionDayId: String(payload.productionDayId || '').trim(),
        time: String(payload.time || '').trim(),
        activity: String(payload.activity || payload.title || '').trim(),
        title: String(payload.title || '').trim(),
        description: String(payload.description || '').trim(),
        owner: String(payload.owner || '').trim(),
        location: String(payload.location || '').trim(),
        note: String(payload.note || '').trim(),
        order: Number(payload.order || 0),
        updatedAt: Date.now(),
        updatedBy: userId,
    };

    const validation = validateRunSheetItemPayload(nextPayload);
    if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(' '));
    }

    await updateDoc(doc(db, RUN_SHEET_COLLECTION, id), nextPayload);
    return { id, ...nextPayload };
};

export const deleteRunSheetItem = async (id) => {
    await deleteDoc(doc(db, RUN_SHEET_COLLECTION, id));
    return true;
};

export const listRunSheetItemsByProductionDay = async (productionDayId) => {
    const q = query(collection(db, RUN_SHEET_COLLECTION), where('productionDayId', '==', productionDayId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(normalizeRunSheetItem)
        .sort((left, right) => Number(left.order || 0) - Number(right.order || 0) || String(left.time || '').localeCompare(String(right.time || '')));
};